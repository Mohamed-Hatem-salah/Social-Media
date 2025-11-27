export const verifyEmail = ({ otp, title }: { otp: number, title: string}):string => {
    // return `<!DOCTYPE html>
    // <html lang="en">
    // <head>
    //   <meta charset="UTF-8" />
    //   <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    //   <title>${title}</title>
    // </head>
    // <body style="margin:0; padding:0; background-color:#f3f3f3; font-family:Arial, sans-serif;">

    //   <!-- Container -->
    //   <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f3f3; padding:30px 0;">
    //     <tr>
    //       <td align="center">
    //         <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border:1px solid #630E2B; border-radius:8px; overflow:hidden;">

    //           <!-- Header -->
    //           <tr>
    //             <td style="padding:20px; background-color:#fff;">
    //               <table width="100%">
    //                 <tr>
    //                   <td align="left">
    //                     <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670702280/Group_35052_icaysu.png" width="100" alt="Logo"/>
    //                   </td>
    //                   <td align="right">
    //                     <a href="${link}" target="_blank" style="color:#630E2B; text-decoration:none; font-size:14px;">View in Website</a>
    //                   </td>
    //                 </tr>
    //               </table>
    //             </td>
    //           </tr>

    //           <!-- Banner -->
    //           <tr>
    //             <td align="center" style="background-color:#630E2B; padding:30px;">
    //               <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703716/Screenshot_1100_yne3vo.png" width="60" height="60" alt="Email Icon"/>
    //             </td>
    //           </tr>

    //           <!-- Title -->
    //           <tr>
    //             <td align="center" style="padding:30px 20px;">
    //               <h1 style="margin:0; font-size:24px; color:#630E2B;">${title}</h1>
    //             </td>
    //           </tr>

    //           <!-- Message -->
    //           <tr>
    //             <td align="center" style="padding:0 40px 20px 40px; color:#333; font-size:16px; line-height:1.5;">
    //               <p>Please use the following OTP to complete your verification process:</p>
    //             </td>
    //           </tr>

    //           <!-- OTP Button -->
    //           <tr>
    //             <td align="center" style="padding:20px;">
    //               <a href="${link}" 
    //                 style="display:inline-block; padding:12px 25px; background-color:#630E2B; color:#ffffff; font-size:18px; font-weight:bold; text-decoration:none; border-radius:5px;">
    //                 ${otp}
    //               </a>
    //             </td>
    //           </tr>

    //           <!-- Footer -->
    //           <tr>
    //             <td align="center" style="padding:30px 20px; background-color:#f9f9f9;">
    //               <h3 style="margin:0; color:#000;">Stay in touch</h3>
    //               <div style="margin-top:15px;">
    //                 <a href="${process.env.facebookLink}" target="_blank" style="margin:0 8px;">
    //                   <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35062_erj5dx.png" width="40" alt="Facebook"/>
    //                 </a>
    //                 <a href="${process.env.instegram}" target="_blank" style="margin:0 8px;">
    //                   <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35063_zottpo.png" width="40" alt="Instagram"/>
    //                 </a>
    //                 <a href="${process.env.twitterLink}" target="_blank" style="margin:0 8px;">
    //                   <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group_35064_i8qtfd.png" width="40" alt="Twitter"/>
    //                 </a>
    //               </div>
    //             </td>
    //           </tr>

    //         </table>
    //       </td>
    //     </tr>
    //   </table>

    // </body>
    // </html>`;



    return `<!DOCTYPE html>
                <html>
                <head>
                    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"></head>
                <style type="text/css">
                body{background-color: #88BDBF;margin: 0px;}
                </style>
                <body style="margin:0px;"> 
                <table border="0" width="50%" style="margin:auto;padding:30px;background-color: #F3F3F3;border:1px solid #630E2B;">
                <tr>
                <td>
                <table border="0" width="100%">
                <tr>
                <td>
                <h1>
                    <img width="100px" src="https://res.cloudinary.com/ddajommsw/image/upload/v1670702280/Group_35052_icaysu.png"/>
                </h1>
                </td>
                <td>
                <p style="text-align: right;"><a href="http://localhost:4200/#/" target="_blank" style="text-decoration: none;">View In Website</a></p>
                </td>
                </tr>
                </table>
                </td>
                </tr>
                <tr>
                <td>
                <table border="0" cellpadding="0" cellspacing="0" style="text-align:center;width:100%;background-color: #fff;">
                <tr>
                <td style="background-color:#630E2B;height:100px;font-size:50px;color:#fff;">
                <img width="50px" height="50px" src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703716/Screenshot_1100_yne3vo.png">
                </td>
                </tr>
                <tr>
                <td>
                <h1 style="padding-top:25px; color:#630E2B">${title}</h1>
                </td>
                </tr>
                <tr>
                <td>
                <p style="padding:0px 100px;">
                </p>
                </td>
                </tr>
                <tr>
                <td>
                <p style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:#630E2B; ">${otp}</p>
                </td>
                </tr>
                </table>
                </td>
                </tr>
                <tr>
                <td>
                <table border="0" width="100%" style="border-radius: 5px;text-align: center;">
                <tr>
                <td>
                <h3 style="margin-top:10px; color:#000">Stay in touch</h3>
                </td>
                </tr>
                <tr>
                <td>
                <div style="margin-top:20px;">

                <a href="${process.env.facebookLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
                <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35062_erj5dx.png" width="50px" hight="50px"></span></a>
                
                <a href="${process.env.instegram}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
                <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35063_zottpo.png" width="50px" hight="50px"></span>
                </a>
                
                <a href="${process.env.twitterLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;;color:#fff;border-radius:50%;">
                <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group_35064_i8qtfd.png" width="50px" hight="50px"></span>
                </a>

                </div>
                </td>
                </tr>
                </table>
                </td>
                </tr>
                </table>
                </body>
                </html>`
}