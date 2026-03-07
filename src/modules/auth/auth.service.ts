import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../schemas/user.schema';
import { SolanaService } from '../solana/solana.service';
import { EmailService } from '../email/email.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private solanaService: SolanaService,
    private emailService: EmailService,
  ) {}

  /**
   * User signup with automatic wallet creation
   */
  async signup(signupDto: SignupDto) {
    const { email, username, password } = signupDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already exists');
      }
      throw new ConflictException('Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate Solana wallet
    const { publicKey, encryptedPrivateKey } =
      this.solanaService.generateWallet();

    // Generate verification code
    const verificationCode = this.generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await this.userModel.create({
      email,
      username,
      password: hashedPassword,
      walletAddress: publicKey,
      encryptedPrivateKey,
      verificationCode,
      verificationCodeExpires,
      emailVerified: false,
    });

    // Request airdrop for new users (devnet only)
    try {
      await this.solanaService.requestAirdrop(publicKey, 2);
      this.logger.log(`Airdrop sent to new user: ${publicKey}`);
    } catch (error) {
      this.logger.warn(`Airdrop failed for ${publicKey}: ${error.message}`);
    }

    // Generate JWT token
    const token = this.generateToken(user._id.toString());

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        email,
        verificationCode,
        username,
      );
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email: ${error.message}`);
      // Still log to console as fallback
      this.logger.log(`Verification code for ${email}: ${verificationCode}`);
    }

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * User signin
   */
  async signin(signinDto: SigninDto) {
    const { email, password } = signinDto;

    // Find user
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user._id.toString());

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Verify email with code
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, code } = verifyEmailDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (new Date() > user.verificationCodeExpires) {
      throw new BadRequestException('Verification code expired');
    }

    // Mark email as verified
    user.emailVerified = true;
    user.verificationCode = null as any;
    user.verificationCodeExpires = null as any;
    await user.save();

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(
        user.email,
        user.username,
        user.walletAddress,
      );
      this.logger.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email: ${error.message}`);
    }

    return {
      message: 'Email verified successfully',
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate new code
    const verificationCode = this.generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        email,
        verificationCode,
        user.username,
      );
      this.logger.log(`Verification email resent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to resend verification email: ${error.message}`);
      // Still log to console as fallback
      this.logger.log(`New verification code for ${email}: ${verificationCode}`);
    }

    return {
      message: 'Verification code sent',
    };
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string): string {
    return this.jwtService.sign({ userId });
  }

  /**
   * Generate 6-digit verification code
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: UserDocument) {
    return {
      id: user._id,
      email: user.email,
      username: user.username,
      name: user.name,
      bio: user.bio,
      avatar: user.avatar,
      walletAddress: user.walletAddress,
      emailVerified: user.emailVerified,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount,
      createdAt: (user as any).createdAt,
    };
  }
}
