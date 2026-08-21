# Email templates (Supabase → Authentication → Emails → Templates)

Paste each block into the matching template tab in the Supabase dashboard:
**Subject heading** goes in the Subject field, the HTML in **Message body**
(source view). The `{{ .Token }}` / `{{ .NewEmail }}` tokens are
filled in by Supabase — leave them exactly as written.

Sender identity (name + members@nwptf.org address) comes from the SMTP
settings, not from these templates.

The portal signs members in with one-time email codes (no passwords), so the
**Magic Link or OTP** template below is the one members see most; the "Reset
password" template is now unused and can be left however it is.

**Why the sign-in templates are code-only (no links):** many member agencies
(USDA, state .gov) run email security that pre-clicks every link in incoming
mail to scan it. Supabase's magic link and the sign-in code share one token,
so a scanner click consumed the token and the code stopped working (confirmed
in the auth logs 2026-08-21: Microsoft Safe Links hit `/verify` 19 seconds
after the email was issued). With no link in the email there is nothing to
scan, and the code survives until the member types it. Do not add
`{{ .ConfirmationURL }}` back to the signup or sign-in templates.

---

## Confirm signup

**Subject:**

```
Welcome to the National Wild Pig Task Force — confirm your email
```

**Message body:**

```html
<div style="background:#f4ede0;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e3ddcf;">
    <img src="https://nwptf.org/assets/nwptf-logo.png" alt="National Wild Pig Task Force" width="200" style="display:block;margin:0 auto 24px;">
    <h2 style="color:#2b3723;font-size:20px;margin:0 0 14px;">One step to activate your membership</h2>
    <p style="color:#23271d;font-size:15px;line-height:1.55;">Thanks for joining the National Wild Pig Task Force &mdash; a network of researchers, managers, and policy professionals working on wild pigs around the world.</p>
    <p style="color:#23271d;font-size:15px;line-height:1.55;">Type this code on the page where you signed up to confirm your email and activate your member profile. The code works once and expires after an hour.</p>
    <p style="text-align:center;margin:24px 0;"><strong style="font-size:26px;letter-spacing:6px;color:#2b3723;">{{ .Token }}</strong></p>
    <p style="font-size:12px;color:#4a5040;">Requesting a new email cancels this code &mdash; always use the one from the newest email. If you didn&rsquo;t request this, you can safely ignore this email.</p>
  </div>
  <p style="text-align:center;font-size:12px;color:#4a5040;margin-top:16px;">National Wild Pig Task Force &middot; nwptf.org</p>
</div>
```

---

## Invite user

**Subject:**

```
You’re invited to join the National Wild Pig Task Force member network
```

**Message body:**

```html
<div style="background:#f4ede0;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e3ddcf;">
    <img src="https://nwptf.org/assets/nwptf-logo.png" alt="National Wild Pig Task Force" width="200" style="display:block;margin:0 auto 24px;">
    <h2 style="color:#2b3723;font-size:20px;margin:0 0 14px;">You&rsquo;re on the Task Force roster &mdash; claim your member profile</h2>
    <p style="color:#23271d;font-size:15px;line-height:1.55;">The National Wild Pig Task Force has a new member portal at <a href="https://nwptf.org" style="color:#a8552e;">nwptf.org</a>, and as a member of the Task Force network you already have a place in it.</p>
    <p style="color:#23271d;font-size:15px;line-height:1.55;">Click below to set your password and fill in your profile &mdash; your areas of interest, committees, and what emails you&rsquo;d like from us. It takes about two minutes, and you control every bit of it:</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="{{ .ConfirmationURL }}" style="background:#a8552e;color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:8px;font-weight:bold;display:inline-block;">Set up my profile</a>
    </p>
    <p style="font-size:12px;color:#4a5040;">Button not working? Copy and paste this link into your browser:<br>{{ .ConfirmationURL }}</p>
    <p style="font-size:12px;color:#4a5040;margin-top:28px;">If you didn&rsquo;t request this, you can safely ignore this email &mdash; nothing will change.</p>
  </div>
  <p style="text-align:center;font-size:12px;color:#4a5040;margin-top:16px;">National Wild Pig Task Force &middot; <a href="https://nwptf.org" style="color:#a8552e;">nwptf.org</a></p>
</div>
```

---

## Reset password

**Subject:**

```
Reset your NWPTF password
```

**Message body:**

```html
<div style="background:#f4ede0;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e3ddcf;">
    <img src="https://nwptf.org/assets/nwptf-logo.png" alt="National Wild Pig Task Force" width="200" style="display:block;margin:0 auto 24px;">
    <h2 style="color:#2b3723;font-size:20px;margin:0 0 14px;">Reset your password</h2>
    <p style="color:#23271d;font-size:15px;line-height:1.55;">Someone (hopefully you) asked to reset the password for the National Wild Pig Task Force member profile linked to this address.</p>
    <p style="color:#23271d;font-size:15px;line-height:1.55;">Click below to choose a new password:</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="{{ .ConfirmationURL }}" style="background:#a8552e;color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:8px;font-weight:bold;display:inline-block;">Choose a new password</a>
    </p>
    <p style="font-size:12px;color:#4a5040;">Button not working? Copy and paste this link into your browser:<br>{{ .ConfirmationURL }}</p>
    <p style="font-size:12px;color:#4a5040;margin-top:28px;">If you didn&rsquo;t request this, you can safely ignore this email &mdash; nothing will change.</p>
  </div>
  <p style="text-align:center;font-size:12px;color:#4a5040;margin-top:16px;">National Wild Pig Task Force &middot; <a href="https://nwptf.org" style="color:#a8552e;">nwptf.org</a></p>
</div>
```

---

## Change email address

**Subject:**

```
Confirm your new email for the NWPTF member portal
```

**Message body:**

```html
<div style="background:#f4ede0;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e3ddcf;">
    <img src="https://nwptf.org/assets/nwptf-logo.png" alt="National Wild Pig Task Force" width="200" style="display:block;margin:0 auto 24px;">
    <h2 style="color:#2b3723;font-size:20px;margin:0 0 14px;">Confirm your new email address</h2>
    <p style="color:#23271d;font-size:15px;line-height:1.55;">You asked to change the email on your National Wild Pig Task Force member profile to <strong>{{ .NewEmail }}</strong>.</p>
    <p style="color:#23271d;font-size:15px;line-height:1.55;">Confirm the change:</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="{{ .ConfirmationURL }}" style="background:#a8552e;color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:8px;font-weight:bold;display:inline-block;">Confirm email change</a>
    </p>
    <p style="font-size:12px;color:#4a5040;">Button not working? Copy and paste this link into your browser:<br>{{ .ConfirmationURL }}</p>
    <p style="font-size:12px;color:#4a5040;margin-top:28px;">If you didn&rsquo;t request this, you can safely ignore this email &mdash; nothing will change.</p>
  </div>
  <p style="text-align:center;font-size:12px;color:#4a5040;margin-top:16px;">National Wild Pig Task Force &middot; <a href="https://nwptf.org" style="color:#a8552e;">nwptf.org</a></p>
</div>
```

---

## Magic Link or OTP (the everyday sign-in email)

Updated in the dashboard 2026-08-21 to be code-only.

**Subject:**

```
Your NWPTF sign-in code
```

**Message body:**

```html
<div style="background:#f4ede0;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e3ddcf;">
    <img src="https://nwptf.org/assets/nwptf-logo.png" alt="National Wild Pig Task Force" width="200" style="display:block;margin:0 auto 24px;">
    <h2 style="color:#2b3723;font-size:20px;margin:0 0 14px;">Here&rsquo;s your sign-in code</h2>
    <p style="color:#23271d;font-size:15px;line-height:1.55;">Type this code into the sign-in page on nwptf.org to access your National Wild Pig Task Force member profile. The code works once and expires after an hour.</p>
    <p style="text-align:center;margin:24px 0;"><strong style="font-size:26px;letter-spacing:6px;color:#2b3723;">{{ .Token }}</strong></p>
    <p style="font-size:12px;color:#4a5040;">Requesting a new email cancels this code &mdash; always use the one from the newest email. If you didn&rsquo;t request this, you can safely ignore this message.</p>
  </div>
</div>
```
