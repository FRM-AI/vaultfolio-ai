import { APIClient } from "@/lib/helper/api_helper";

const BASE_URL = "/api/auth/login";

const apiClient = new APIClient();


const Login = (data: { email: string; password: string }) => {
  return apiClient.create(BASE_URL, data);
}

const AuthService = {
  Login,
};
export default AuthService;
