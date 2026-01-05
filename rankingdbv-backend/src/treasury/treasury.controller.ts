import { Controller, Get, Post, Body, Param, UseGuards, Patch, Delete, UseInterceptors, UploadedFile, BadRequestException, Request, UnauthorizedException } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { SettleTransactionDto } from './dto/settle-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClubAccessGuard } from '../auth/club-access.guard';
import { UploadsService } from '../uploads/uploads.service';

@Controller('treasury')
@UseGuards(JwtAuthGuard, ClubAccessGuard)
export class TreasuryController {
    constructor(
        private readonly treasuryService: TreasuryService,
        private readonly uploadsService: UploadsService
    ) { }

    @Post()
    create(@Body() createTransactionDto: CreateTransactionDto) {
        return this.treasuryService.create(createTransactionDto);
    }

    @Post('bulk')
    createBulk(@Body() body: any) {
        return this.treasuryService.createBulk(body);
    }

    @Get('club/:clubId')
    findAll(@Param('clubId') clubId: string, @Request() req) {
        // Access check handled by ClubAccessGuard
        return this.treasuryService.findAll(clubId);
    }

    @Get('balance/:clubId')
    getBalance(@Param('clubId') clubId: string, @Request() req) {
        // Access check handled by ClubAccessGuard
        return this.treasuryService.getBalance(clubId);
    }

    @Get('user/:userId')
    findForUser(@Param('userId') userId: string) {
        return this.treasuryService.findForUser(userId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
        return this.treasuryService.update(id, updateTransactionDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.treasuryService.remove(id);
    }

    @Post(':id/settle')
    settle(@Param('id') id: string, @Body() settleTransactionDto: SettleTransactionDto) {
        return this.treasuryService.settle(id, settleTransactionDto);
    }

    @Post(':id/approve')
    approve(@Param('id') id: string) {
        return this.treasuryService.approve(id);
    }

    @Post(':id/reject')
    reject(@Param('id') id: string) {
        return this.treasuryService.reject(id);
    }

    @Post(':id/pay')
    @UseInterceptors(FileInterceptor('file'))
    async pay(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Body('proofUrl') proofUrl?: string) {
        let finalUrl = proofUrl;

        if (file) {
            const result = await this.uploadsService.uploadFile(file, 'treasury_proofs');
            finalUrl = result.url;
        }

        if (!finalUrl) {
            throw new BadRequestException('É necessário enviar um arquivo ou link de comprovante.');
        }

        return this.treasuryService.pay(id, finalUrl);
    }
}
