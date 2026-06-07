import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<any>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            username: any;
            email: any;
            role: any;
            licenseLimit: any;
            status: any;
        };
    }>;
    getProfile(user: any): Promise<any>;
    changePassword(user: any, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    getAllUsers(): Promise<any>;
}
