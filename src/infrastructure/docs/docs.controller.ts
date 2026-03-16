import { Controller, Get, Header } from '@nestjs/common';
import { DocsService } from './docs.service';

@Controller()
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Get('openapi.json')
  openapi() {
    return this.docsService.getOpenApiDocument();
  }

  @Get('docs')
  @Header('content-type', 'text/html')
  docs() {
    return this.docsService.getDocsHtml();
  }
}
