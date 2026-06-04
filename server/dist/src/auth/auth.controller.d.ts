import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        email: string;
        username: string;
        role: string;
        licenseLimit: number;
        id: string;
        status: string;
        createdAt: Date;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            username: string;
            email: string;
            role: string;
            licenseLimit: number;
            status: string;
        };
    }>;
    getProfile(user: any): Promise<any>;
    getAllUsers(): Promise<{
        email: string;
        username: string;
        role: string;
        licenseLimit: number;
        id: string;
        status: string;
        createdAt: Date;
    }[]>;
}
