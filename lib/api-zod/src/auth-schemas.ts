import * as zod from "zod";

export const AuthUserSchema = zod.object({
  id: zod.string(),
  email: zod.string().nullable(),
  firstName: zod.string().nullable(),
  lastName: zod.string().nullable(),
  profileImageUrl: zod.string().nullable(),
});

export type AuthUser = zod.infer<typeof AuthUserSchema>;

export const GetCurrentAuthUserResponse = zod.object({
  user: AuthUserSchema.nullable(),
});
export type GetCurrentAuthUserResponseType = zod.infer<typeof GetCurrentAuthUserResponse>;

export const ExchangeMobileAuthorizationCodeBody = zod.object({
  code: zod.string().min(1),
  code_verifier: zod.string().min(1),
  redirect_uri: zod.string().min(1),
  state: zod.string().min(1),
  nonce: zod.string().min(1).optional(),
});
export type ExchangeMobileAuthorizationCodeBodyType = zod.infer<typeof ExchangeMobileAuthorizationCodeBody>;

export const ExchangeMobileAuthorizationCodeResponse = zod.object({
  token: zod.string(),
});
export type ExchangeMobileAuthorizationCodeResponseType = zod.infer<typeof ExchangeMobileAuthorizationCodeResponse>;

export const LogoutMobileSessionResponse = zod.object({
  success: zod.literal(true),
});
export type LogoutMobileSessionResponseType = zod.infer<typeof LogoutMobileSessionResponse>;
