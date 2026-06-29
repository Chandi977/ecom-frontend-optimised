import "axios";

declare module "axios" {
  /**
   * App-specific request flag. When true, a 401 response will NOT redirect the
   * browser to /login (used for "silent" auth probes). Set via buildRequestConfig
   * and read in the response interceptor in services/service.ts.
   */
  export interface AxiosRequestConfig {
    suppressAuthRedirect?: boolean;
  }
}
