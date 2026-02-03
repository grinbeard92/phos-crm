import {
  Controller,
  Get,
  Param,
  Req,
  Res,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { type Request, type Response } from 'express';

import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { PdfGenerationService } from '../services/pdf-generation.service';

type AuthenticatedRequest = Request & {
  workspaceId: string;
  user: { workspaceId: string };
};

@Controller('pdf')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class PdfGenerationController {
  constructor(
    private readonly pdfGenerationService: PdfGenerationService,
  ) {}

  @Get('quotes/:id')
  async generateQuotePdf(
    @Param('id') quoteId: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    try {
      const workspaceId = req.user?.workspaceId || req.workspaceId;

      if (!workspaceId) {
        throw new HttpException(
          'Workspace ID not found',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Generate PDF stream
      const pdfStream = await this.pdfGenerationService.generateQuotePdfStream(
        quoteId,
        workspaceId,
      );

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="quote-${quoteId}.pdf"`,
      );

      // Pipe stream to response
      pdfStream.pipe(res);
    } catch (error) {
      throw new HttpException(
        `Failed to generate quote PDF: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('invoices/:id')
  async generateInvoicePdf(
    @Param('id') invoiceId: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    try {
      const workspaceId = req.user?.workspaceId || req.workspaceId;

      if (!workspaceId) {
        throw new HttpException(
          'Workspace ID not found',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Generate PDF stream
      const pdfStream = await this.pdfGenerationService.generateInvoicePdfStream(
        invoiceId,
        workspaceId,
      );

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="invoice-${invoiceId}.pdf"`,
      );

      // Pipe stream to response
      pdfStream.pipe(res);
    } catch (error) {
      throw new HttpException(
        `Failed to generate invoice PDF: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
