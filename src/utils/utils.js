
const crypto = require("crypto");

const generateOtp = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

const getOtpHtml = (otp, username = "User") => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <title>Email Verification</title>
</head>

<body style="
    margin:0;
    padding:0;
    background-color:#f1f5f9;
    font-family:Arial,Helvetica,sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#f1f5f9;padding:35px 12px;">

<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="
        max-width:520px;
        background-color:#ffffff;
        border-radius:16px;
        overflow:hidden;
    ">

    <!-- HEADER -->
    <tr>
        <td align="center"
            style="
                background-color:#111827;
                padding:38px 25px;
            ">

            <div style="
                display:inline-block;
                background-color:#263449;
                padding:10px 18px;
                border-radius:30px;
                color:#93c5fd;
                font-size:12px;
                font-weight:bold;
                letter-spacing:2px;
            ">
                ACCOUNT SECURITY
            </div>

            <h1 style="
                color:#ffffff;
                font-size:28px;
                margin:22px 0 8px;
                font-weight:700;
            ">
                Verify Your Email
            </h1>

            <p style="
                color:#cbd5e1;
                font-size:14px;
                margin:0;
                line-height:22px;
            ">
                One more step to get started.
            </p>

        </td>
    </tr>

    <!-- MAIN CONTENT -->
    <tr>
        <td style="padding:35px 30px 25px;">

            <h2 style="
                color:#111827;
                font-size:21px;
                margin:0 0 14px;
            ">
                Hello ${username},
            </h2>

            <p style="
                color:#64748b;
                font-size:15px;
                line-height:25px;
                margin:0 0 25px;
            ">
                Thanks for creating your account!
                Please use the verification code below
                to confirm your email address.
            </p>

            <!-- OTP BOX -->
            <table width="100%" cellpadding="0" cellspacing="0"
                style="
                    background-color:#f8fafc;
                    border:1px solid #e2e8f0;
                    border-radius:12px;
                ">

                <tr>
                    <td align="center" style="padding:25px 15px;">

                        <p style="
                            color:#64748b;
                            font-size:11px;
                            font-weight:bold;
                            letter-spacing:3px;
                            margin:0 0 15px;
                        ">
                            YOUR VERIFICATION CODE
                        </p>

                        <h1 style="
                            color:#2563eb;
                            font-size:38px;
                            letter-spacing:10px;
                            font-weight:bold;
                            margin:0;
                            padding-left:10px;
                        ">
                            ${otp}
                        </h1>

                    </td>
                </tr>
            </table>

            <!-- EXPIRY -->
            <table width="100%" cellpadding="0" cellspacing="0"
                style="margin-top:22px;">

                <tr>
                    <td width="35" valign="top">
                        <div style="
                            background-color:#eff6ff;
                            color:#2563eb;
                            width:30px;
                            height:30px;
                            line-height:30px;
                            text-align:center;
                            border-radius:50%;
                            font-size:16px;
                        ">
                            !
                        </div>
                    </td>

                    <td valign="middle">
                        <p style="
                            color:#334155;
                            font-size:13px;
                            line-height:21px;
                            margin:0;
                        ">
                            This code expires in
                            <strong style="color:#2563eb;">
                                5 minutes
                            </strong>.
                            Please verify your email before it expires.
                        </p>
                    </td>
                </tr>
            </table>

            <!-- SECURITY WARNING -->
            <table width="100%" cellpadding="0" cellspacing="0"
                style="
                    margin-top:25px;
                    background-color:#fff7ed;
                    border-left:4px solid #f97316;
                ">

                <tr>
                    <td style="padding:15px 17px;">

                        <p style="
                            color:#9a3412;
                            font-size:13px;
                            font-weight:bold;
                            margin:0 0 6px;
                        ">
                            Security Reminder
                        </p>

                        <p style="
                            color:#9a3412;
                            font-size:12px;
                            line-height:20px;
                            margin:0;
                        ">
                            Never share this OTP with anyone.
                            Our team will never ask you for this code.
                        </p>

                    </td>
                </tr>
            </table>

            <p style="
                color:#94a3b8;
                font-size:13px;
                line-height:21px;
                margin:25px 0 0;
            ">
                If you did not create this account,
                you can safely ignore this email.
            </p>

            <p style="
                color:#334155;
                font-size:14px;
                line-height:22px;
                margin:25px 0 0;
            ">
                Best regards,<br>
                <strong>Your Support Team</strong>
            </p>

        </td>
    </tr>

    <!-- FOOTER -->
    <tr>
        <td align="center"
            style="
                background-color:#f8fafc;
                border-top:1px solid #e2e8f0;
                padding:22px 15px;
            ">

            <p style="
                color:#64748b;
                font-size:12px;
                margin:0 0 7px;
            ">
                This is an automated email. Please do not reply.
            </p>

            <p style="
                color:#94a3b8;
                font-size:11px;
                margin:0;
            ">
                &copy; ${new Date().getFullYear()} All rights reserved.
            </p>

        </td>
    </tr>

</table>

</td>
</tr>
</table>

</body>
</html>
    `;
};

module.exports = {
    generateOtp,
    getOtpHtml
};
