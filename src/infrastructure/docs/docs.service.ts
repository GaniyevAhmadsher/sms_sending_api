import { Injectable } from '@nestjs/common';

@Injectable()
export class DocsService {
  getOpenApiDocument() {
    return {
      openapi: '3.0.0',
      info: {
        title: 'SMS Sending SaaS API',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          apiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' },
        },
        schemas: {
          RegisterDto: {
            type: 'object',
            properties: { email: { type: 'string' }, password: { type: 'string' }, name: { type: 'string' } },
            required: ['email', 'password'],
          },
          LoginDto: {
            type: 'object',
            properties: { email: { type: 'string' }, password: { type: 'string' } },
            required: ['email', 'password'],
          },
          SendSmsDto: {
            type: 'object',
            properties: { to: { type: 'string' }, body: { type: 'string' } },
            required: ['to', 'body'],
          },
        },
      },
      paths: {
        '/health': { get: { summary: 'Health check' } },
        '/auth/register': {
          post: {
            summary: 'Register user',
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterDto' } } } },
          },
        },
        '/auth/login': {
          post: {
            summary: 'Login user',
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginDto' } } } },
          },
        },
        '/sms/send': {
          post: {
            summary: 'Send SMS',
            security: [{ apiKeyAuth: [] }],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SendSmsDto' } } } },
          },
        },
      },
    };
  }

  getDocsHtml() {
    return `<!doctype html>
<html>
  <head><title>SMS API Docs</title></head>
  <body>
    <h1>SMS Sending SaaS API Docs</h1>
    <p>OpenAPI JSON: <a href="/openapi.json">/openapi.json</a></p>
    <pre id="content"></pre>
    <script>
      fetch('/openapi.json').then(r => r.json()).then(j => {
        document.getElementById('content').textContent = JSON.stringify(j, null, 2);
      });
    </script>
  </body>
</html>`;
  }
}
