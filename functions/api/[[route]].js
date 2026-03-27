export async function onRequest(context){
  const{request,env}=context;
  const url=new URL(request.url);
  const path=url.pathname.replace('/api/','').replace(/\/$/,'');

  if(request.method==='OPTIONS')return new Response(null,{headers:CORS});
  // Safety check — if KV not bound return proper JSON error
  if(!env||!env.KV)return json({ok:false,msg:'KV not configured.'},503);
  try{ await seedIfEmpty(env); }catch(e){ return json({ok:false,msg:'KV init error: '+e.message},503); }

  // ── PUBLIC GET ROUTES ──────────────────────────────────────────────
  if(request.method==='GET'&&path==='data'){
    const type=url.searchParams.get('type');
    if(type==='all'){
      const[settings,categories,products]=await Promise.all([getKV(env,'settings',DEFAULT_SETTINGS),getKV(env,'categories',DEFAULT_CATEGORIES),getKV(env,'products',DEFAULT_PRODUCTS)]);
      return json({settings,categories,products:products.filter(p=>p.active!==false)});
    }
    return err('Invalid type');
  }

  // ── PUBLIC POST ROUTES (NO AUTH REQUIRED) ──────────────────────────
  if(request.method==='POST'){
    
    // 1. Enquiry Submit
    if(path==='enquiry'){
      const body=await request.json().catch(()=>({}));
      const enquiries=await getKV(env,'enquiries',[]);
      enquiries.unshift({id:'eq'+Date.now(),...body,status:'new',ts:Date.now()});
      await setKV(env,'enquiries',enquiries.slice(0,500));
      return json({ok:true});
    }

    // 2. Standard Login
    if(path==='login'){
      const body=await request.json().catch(()=>({}));
      const admins=await getKV(env,'admins',null);
      if(!admins){
        const settings=await getKV(env,'settings',DEFAULT_SETTINGS);
        if(body.password===(settings.admin_password||'admin123')){
          const token=await generateToken();
          await env.KV.put('auth:'+token,JSON.stringify({role:'superadmin',username:'admin'}),{expirationTtl:86400});
          return json({ok:true,token,requireTotp:false,role:'superadmin',name:'Admin'});
        }
        return json({ok:false,msg:'Wrong credentials'},401);
      }
      const admin=admins.find(a=>a.username===body.username&&a.password===body.password);
      if(!admin)return json({ok:false,msg:'Wrong username or password'},401);
      if(admin.totp_enabled&&admin.totp_secret){
        const tmpToken=await generateToken();
        await env.KV.put('tmp:'+tmpToken,JSON.stringify({username:admin.username}),{expirationTtl:300});
        return json({ok:true,requireTotp:true,tmp_token:tmpToken});
      }
      const authToken=await generateToken();
      await env.KV.put('auth:'+authToken,JSON.stringify({role:admin.role,username:admin.username,id:admin.id,name:admin.name}),{expirationTtl:86400});
      return json({ok:true,token:authToken,requireTotp:false,role:admin.role,username:admin.username,name:admin.name});
    }

    // 3. TOTP Login Verify
    if(path==='login/totp'){
      const body=await request.json().catch(()=>({}));
      const {tmp_token,code}=body;
      if(!tmp_token||!code)return json({ok:false,msg:'Missing token or code'},400);
      const stored=await env.KV.get('tmp:'+tmp_token);
      if(!stored)return json({ok:false,msg:'Session expired. Please login again.'},401);
      const {username}=JSON.parse(stored);
      const admins=await getKV(env,'admins',[]);
      const admin=admins.find(a=>a.username===username);
      if(!admin)return json({ok:false,msg:'Admin not found'},404);
      if(!(await verifyTOTP(admin.totp_secret,code)))return json({ok:false,msg:'Invalid code. Try again.'},401);
      await env.KV.delete('tmp:'+tmp_token);
      const authToken=await generateToken();
      await env.KV.put('auth:'+authToken,JSON.stringify({role:admin.role,username:admin.username,id:admin.id,name:admin.name}),{expirationTtl:86400});
      return json({ok:true,token:authToken,role:admin.role,username:admin.username,name:admin.name});
    }

    // 4. Forgot Password Request
    if(path==='admin/forgot-password'){
      const body=await request.json().catch(()=>({}));
      const {username}=body;
      if(!username)return json({ok:false,msg:'Username required'},400);
      const admins=await getKV(env,'admins',[]);
      const admin=admins.find(a=>a.username===username);
      const s=await getKV(env,'settings',DEFAULT_SETTINGS);
      if(admin){
        const adminEmail=admin.email||s.email1||'info@memaneinternational.in';
        const tokenBytes=new Uint8Array(32);
        crypto.getRandomValues(tokenBytes);
        const resetToken=Array.from(tokenBytes).map(b=>b.toString(16).padStart(2,'0')).join('');
        await env.KV.put(`pwreset:${resetToken}`,JSON.stringify({username:admin.username,created:Date.now()}),{expirationTtl:3600});
        const resetLink=`https://memaneinternational.in/admin.html?reset=${resetToken}`;
        await sendEmail(adminEmail,admin.name||admin.username,'Reset Your Admin Password — Memane International',
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#1A2B5F;padding:24px;text-align:center;"><h2 style="color:#fff;margin:0;">Memane International</h2><p style="color:#C9A84C;margin:4px 0 0;font-size:13px;">Password Reset Request</p></div><div style="padding:28px;background:#f9f9f9;border:1px solid #e0e0e0;"><p>Hi <strong>${admin.name||admin.username}</strong>,</p><p>We received a request to reset the password for your Memane International admin account.</p><div style="text-align:center;margin:28px 0;"><a href="${resetLink}" style="background:#9B1C31;color:#fff;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;display:inline-block;">Reset My Password</a></div><p style="color:#666;font-size:13px;">Or copy this link: <a href="${resetLink}">${resetLink}</a></p><p style="color:#666;font-size:13px;">⏱ This link expires in <strong>1 hour</strong>.</p><p style="color:#666;font-size:13px;">If you did not request this, you can safely ignore this email.</p><hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;"><p style="color:#999;font-size:12px;">— Memane International Admin System · memaneinternational.in</p></div></div>`
        );
      }
      return json({ok:true,msg:'If that username exists, a reset link has been sent to the registered email.'});
    }

    // 5. Reset Password Confirm
    if(path==='admin/reset-password'){
      const body=await request.json().catch(()=>({}));
      const {token:resetToken,newPassword}=body;
      if(!resetToken||!newPassword)return json({ok:false,msg:'Token and new password required'},400);
      if(newPassword.length<8)return json({ok:false,msg:'Password must be at least 8 characters'},400);
      const stored=await env.KV.get(`pwreset:${resetToken}`);
      if(!stored)return json({ok:false,msg:'This reset link has expired or already been used. Please request a new one.'},400);
      const {username}=JSON.parse(stored);
      const admins=await getKV(env,'admins',[]);
      const idx=admins.findIndex(a=>a.username===username);
      if(idx<0)return json({ok:false,msg:'Account not found'},404);
      admins[idx].password=newPassword;
      admins[idx].password_changed=Date.now();
      await setKV(env,'admins',admins);
      await env.KV.delete(`pwreset:${resetToken}`);
      const s=await getKV(env,'settings',DEFAULT_SETTINGS);
      const adminEmail=admins[idx].email||s.email1||'info@memaneinternational.in';
      await sendEmail(adminEmail,admins[idx].name||username,'Password Reset Successful — Memane International',
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#1A2B5F;padding:24px;text-align:center;"><h2 style="color:#fff;margin:0;">Memane International</h2><p style="color:#27AE60;margin:4px 0 0;font-size:13px;">✅ Password Reset Successful</p></div><div style="padding:28px;background:#f9f9f9;border:1px solid #e0e0e0;"><p>Hi <strong>${admins[idx].name||username}</strong>,</p><p>Your admin password has been successfully reset on <strong>${new Date().toUTCString()}</strong>.</p><p><a href="https://memaneinternational.in/admin.html" style="color:#9B1C31;font-weight:bold;">Click here to log in</a> with your new password.</p><p style="color:#c0392b;font-size:13px;"><strong>If you did not make this change, contact the system administrator immediately.</strong></p><hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;"><p style="color:#999;font-size:12px;">— Memane International Admin System · memaneinternational.in</p></div></div>`
      );
      return json({ok:true,msg:'Password reset successfully. You can now log in with your new password.'});
    }

    // ── PROTECTED ADMIN ROUTES ───────────────────────────────────────
    // If the path didn't match the public ones above, we require a token.
    const authHeader=request.headers.get('Authorization')||'';
    const token=authHeader.replace('Bearer ','');
    const session=await validateToken(env,token);

    // Session check endpoint (Handles the /api/admin ping from the frontend)
    if(path==='admin' || path==='admin/verify') {
       if(!session) return json({ok:false, msg:'Not authenticated'}, 401);
       return json({ok:true, session});
    }

    // All other routes require authentication
    if(!session) return json({ok:false,msg:'Not authenticated'},403);

    const body=await request.json().catch(()=>({}));

    if(path==='admin/data'){
      const[settings,categories,products,enquiries,admins]=await Promise.all([getKV(env,'settings',DEFAULT_SETTINGS),getKV(env,'categories',DEFAULT_CATEGORIES),getKV(env,'products',DEFAULT_PRODUCTS),getKV(env,'enquiries',[]),getKV(env,'admins',[])]);
      return json({settings,categories,products,enquiries,admins:admins.map(a=>({...a,password:undefined,totp_secret:undefined})),session});
    }
    if(path==='admin/save-settings'){const s=await getKV(env,'settings',DEFAULT_SETTINGS);['company','proprietor','tagline','about_short','about_long','phone1','phone2','whatsapp','email1','email2','website','address','hours','hero_badge','hero_h1','hero_sub','w3f_enquiry','w3f_contact','admin_password'].forEach(k=>{if(body[k]!==undefined)s[k]=body[k];});await setKV(env,'settings',s);return json({ok:true});}
    if(path==='admin/save-categories'){await setKV(env,'categories',body.categories);return json({ok:true});}
    if(path==='admin/save-products'){await setKV(env,'products',body.products);return json({ok:true});}
    if(path==='admin/save-enquiries'){await setKV(env,'enquiries',body.enquiries);return json({ok:true});}
    if(path==='admin/totp-setup'){const secret=genSecret();const s=await getKV(env,'settings',DEFAULT_SETTINGS);const otpauth=`otpauth://totp/${encodeURIComponent(s.company||'Memane')}:${encodeURIComponent(session.username)}?secret=${secret}&issuer=${encodeURIComponent(s.company||'Memane')}`;await env.KV.put('totp-pending:'+token,secret,{expirationTtl:600});return json({ok:true,secret,otpauth});}
    if(path==='admin/totp-confirm'){const secret=await env.KV.get('totp-pending:'+token);if(!secret)return json({ok:false,msg:'Setup expired'});if(!(await verifyTOTP(secret,body.code)))return json({ok:false,msg:'Invalid code'});const admins=await getKV(env,'admins',[]);const idx=admins.findIndex(a=>a.username===session.username);if(idx>=0){admins[idx].totp_secret=secret;admins[idx].totp_enabled=true;await setKV(env,'admins',admins);}await env.KV.delete('totp-pending:'+token);return json({ok:true});}
    
    if(path==='admin/save-admin'){
      if(session.role!=='superadmin')return json({ok:false,msg:'Superadmin only'},403);
      const {id,username,password,role,email,name}=body;
      if(!username)return json({ok:false,msg:'Username required'},400);
      if(!email)return json({ok:false,msg:'Email required for password resets'},400);
      const admins=await getKV(env,'admins',[]);
      if(id){
        const idx=admins.findIndex(a=>a.id===id);
        if(idx<0)return json({ok:false,msg:'Admin not found'},404);
        admins[idx].username=username;
        admins[idx].role=role||admins[idx].role;
        admins[idx].email=email;
        admins[idx].name=name||admins[idx].name;
        if(password)admins[idx].password=password;
        await setKV(env,'admins',admins);
        return json({ok:true,msg:'Admin updated'});
      } else {
        if(!password)return json({ok:false,msg:'Password required for new admin'},400);
        if(admins.find(a=>a.username===username))return json({ok:false,msg:'Username already exists'},409);
        admins.push({id:'adm_'+Date.now(),username,password,role:role||'editor',email,name:name||username,totp_secret:null,totp_enabled:false,created:Date.now()});
        await setKV(env,'admins',admins);
        return json({ok:true,msg:'Admin added'});
      }
    }
    if(path==='admin/save-admins'){if(session.role!=='superadmin')return json({ok:false,msg:'Superadmin only'},403);await setKV(env,'admins',body.admins);return json({ok:true});}

    if(path==='admin/change-password'){
      const {currentPassword,newPassword}=body;
      if(!currentPassword||!newPassword)return json({ok:false,msg:'Both fields required'},400);
      if(newPassword.length<8)return json({ok:false,msg:'New password must be at least 8 characters'},400);
      const admins=await getKV(env,'admins',[]);
      const idx=admins.findIndex(a=>a.username===session.username);
      if(idx<0)return json({ok:false,msg:'Admin not found'},404);
      if(admins[idx].password!==currentPassword)return json({ok:false,msg:'Current password is incorrect'},401);
      admins[idx].password=newPassword;
      admins[idx].password_changed=Date.now();
      await setKV(env,'admins',admins);
      const s=await getKV(env,'settings',DEFAULT_SETTINGS);
      const adminEmail=admins[idx].email||s.email1||'info@memaneinternational.in';
      await sendEmail(adminEmail,admins[idx].name||session.username,'Admin Password Changed — Memane International',
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#1A2B5F;padding:24px;text-align:center;"><h2 style="color:#fff;margin:0;">Memane International</h2><p style="color:#C9A84C;margin:4px 0 0;font-size:13px;">Admin Security Alert</p></div><div style="padding:28px;background:#f9f9f9;border:1px solid #e0e0e0;"><p>Hi <strong>${admins[idx].name||session.username}</strong>,</p><p>Your admin password was successfully changed on <strong>${new Date().toUTCString()}</strong>.</p><p style="color:#c0392b;"><strong>If you did not make this change, contact the system administrator immediately.</strong></p><hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;"><p style="color:#999;font-size:12px;">— Memane International Admin System · memaneinternational.in</p></div></div>`
      );
      return json({ok:true,msg:'Password changed successfully. A confirmation email has been sent.'});
    }

    if(path==='admin/save-product'){
      const prods=await getKV(env,'products',DEFAULT_PRODUCTS);
      const p=body;
      if(!p.id)p.id='p'+Date.now();
      if(!p.active===undefined)p.active=true;
      const idx=prods.findIndex(x=>x.id===p.id);
      if(idx>=0)prods[idx]=p; else prods.push(p);
      await setKV(env,'products',prods);
      return json({ok:true,msg:'Product saved'});
    }
    if(path==='admin/toggle-product'){
      const prods=await getKV(env,'products',DEFAULT_PRODUCTS);
      const idx=prods.findIndex(x=>x.id===body.id);
      if(idx<0)return json({ok:false,msg:'Product not found'},404);
      prods[idx].active=!prods[idx].active;
      await setKV(env,'products',prods);
      return json({ok:true,active:prods[idx].active});
    }
    if(path==='admin/delete-product'){
      const prods=await getKV(env,'products',DEFAULT_PRODUCTS);
      const filtered=prods.filter(x=>x.id!==body.id);
      await setKV(env,'products',filtered);
      return json({ok:true,msg:'Product deleted'});
    }
    if(path==='admin/save-category'){
      const cats=await getKV(env,'categories',DEFAULT_CATEGORIES);
      const c=body;
      if(!c.id)c.id='cat'+Date.now();
      const idx=cats.findIndex(x=>x.id===c.id);
      if(idx>=0)cats[idx]=c; else cats.push(c);
      await setKV(env,'categories',cats);
      return json({ok:true,msg:'Category saved'});
    }
    if(path==='admin/delete-category'){
      const cats=await getKV(env,'categories',DEFAULT_CATEGORIES);
      await setKV(env,'categories',cats.filter(x=>x.id!==body.id));
      return json({ok:true,msg:'Category deleted'});
    }
    if(path==='admin/update-enquiry'){
      const enqs=await getKV(env,'enquiries',[]);
      const idx=enqs.findIndex(x=>x.id===body.id);
      if(idx>=0){Object.assign(enqs[idx],body);await setKV(env,'enquiries',enqs);}
      return json({ok:true});
    }
    if(path==='admin/delete-enquiry'){
      const enqs=await getKV(env,'enquiries',[]);
      await setKV(env,'enquiries',enqs.filter(x=>x.id!==body.id));
      return json({ok:true,msg:'Enquiry deleted'});
    }
    if(path==='admin/reset-products'){
      if(session.role!=='superadmin')return json({ok:false,msg:'Superadmin only'},403);
      await setKV(env,'products',DEFAULT_PRODUCTS);
      await setKV(env,'categories',DEFAULT_CATEGORIES);
      return json({ok:true,msg:'Products and categories reset to defaults'});
    }
    if(path==='admin/logout'){
      await env.KV.delete('auth:'+token);
      return json({ok:true,msg:'Logged out'});
    }
    if(path==='admin/delete-admin'){
      if(session.role!=='superadmin')return json({ok:false,msg:'Superadmin only'},403);
      if(body.id===session.id)return json({ok:false,msg:'Cannot delete yourself'},400);
      const admins=await getKV(env,'admins',[]);
      await setKV(env,'admins',admins.filter(a=>a.id!==body.id));
      return json({ok:true,msg:'Admin deleted'});
    }
    if(path==='admin/reset-totp'){
      if(session.role!=='superadmin')return json({ok:false,msg:'Superadmin only'},403);
      const admins=await getKV(env,'admins',[]);
      const idx=admins.findIndex(a=>a.id===body.id);
      if(idx<0)return json({ok:false,msg:'Admin not found'},404);
      admins[idx].totp_secret=null;admins[idx].totp_enabled=false;
      await setKV(env,'admins',admins);
      return json({ok:true,msg:'2FA reset'});
    }

    return err('Unknown route');
  }

  return err('Method not allowed',405);
}
