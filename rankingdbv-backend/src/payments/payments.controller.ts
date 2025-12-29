
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('pix')
    async createPix(@Body() body: { amount: number; description: string; userId: string; userName: string; userEmail: string }) {
        return this.paymentsService.createPixCharge(
            body.amount,
            body.description,
            body.userId,
            body.userName,
            body.userEmail
        );
    }
}
