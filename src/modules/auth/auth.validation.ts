import { z } from 'zod';
import { generalFeilds } from '../../middleware/validation.middleware';




export const login = {
    body: z
        .strictObject({
            email: generalFeilds.email,
            password: generalFeilds.password,
        })
}



export const signup = {
    body: login.body.extend
        ({
            username: generalFeilds.username,
            confirmPassword: generalFeilds.confirmPassword,
        })
        .superRefine((data, ctx) => {
            console.log(data, ctx);

            if (data.confirmPassword !== data.password) {
                ctx.addIssue({
                    code: "custom",
                    path: ['confirmPassword'],
                    message: "Passwords does not match",
                })
            }
        }),
};



export const confirmEmail = {
    body: z.strictObject({
        email: generalFeilds.email,
        otp: generalFeilds.otp,
    })
};


export const signupWithGmail = {
    body: z.strictObject({
        idToken: z.string(),
    })
};


export const sendForgotPasswordCode = {
    body: z.strictObject({
        email: generalFeilds.email,
    })
};


export const verifyForgotPassword = {
    body: sendForgotPasswordCode.body.extend({
        otp: generalFeilds.otp,
    })
};


export const ResetForgotPassword = {
    body: verifyForgotPassword.body.extend({
        otp: generalFeilds.otp,
        password: generalFeilds.password,
        confirmPassword: generalFeilds.confirmPassword,
    }).refine((data)=>{
        return data.password === data.confirmPassword;
    }, {message: "Passwords mismatch confirm-password" , path: ['confirmPassword']})
};