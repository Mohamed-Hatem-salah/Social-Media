import z from "zod";
import { freezeAccount, hardDelete, logout, restoreAccount } from "./user.validation";


export type IlogoutDto = z.infer<typeof logout.body>
export type IFreezAccountDto = z.infer<typeof freezeAccount.params>
export type IRestoreAccountDto = z.infer<typeof restoreAccount.params>
export type IHardDeleteAccountDto = z.infer<typeof hardDelete.params>