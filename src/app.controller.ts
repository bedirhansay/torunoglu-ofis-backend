import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  @Get()
  getHtml(@Res() res: Response) {
    const html = `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Torunoğlu Backend API</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #333;
            }
            
            .container {
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(10px);
              border-radius: 20px;
              padding: 40px;
              max-width: 800px;
              width: 90%;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
              text-align: center;
              animation: slideUp 0.8s ease-out;
            }
            
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            .logo {
              font-size: 4rem;
              margin-bottom: 20px;
              background: linear-gradient(45deg, #667eea, #764ba2);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            
            h1 {
              font-size: 2.5rem;
              margin-bottom: 10px;
              color: #2c3e50;
              font-weight: 700;
            }
            
            .subtitle {
              font-size: 1.2rem;
              color: #7f8c8d;
              margin-bottom: 40px;
              font-weight: 300;
            }
            
            .status-badge {
              display: inline-block;
              background: linear-gradient(45deg, #00b894, #00cec9);
              color: white;
              padding: 8px 20px;
              border-radius: 25px;
              font-size: 0.9rem;
              font-weight: 600;
              margin-bottom: 30px;
              box-shadow: 0 4px 15px rgba(0, 184, 148, 0.3);
            }
            
            .docs-section {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              border-radius: 15px;
              padding: 30px;
              margin: 30px 0;
              border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .docs-title {
              font-size: 1.5rem;
              color: #2c3e50;
              margin-bottom: 20px;
              font-weight: 600;
            }
            
            .swagger-button {
              display: inline-block;
              background: linear-gradient(45deg, #ff6b6b, #ee5a24);
              color: white;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 50px;
              font-size: 1.1rem;
              font-weight: 600;
              transition: all 0.3s ease;
              box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
              margin: 10px;
            }
            
            .swagger-button:hover {
              transform: translateY(-3px);
              box-shadow: 0 12px 35px rgba(255, 107, 107, 0.4);
              text-decoration: none;
              color: white;
            }
            
            .redoc-button {
              display: inline-block;
              background: linear-gradient(45deg, #74b9ff, #0984e3);
              color: white;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 50px;
              font-size: 1.1rem;
              font-weight: 600;
              transition: all 0.3s ease;
              box-shadow: 0 8px 25px rgba(116, 185, 255, 0.3);
              margin: 10px;
            }
            
            .redoc-button:hover {
              transform: translateY(-3px);
              box-shadow: 0 12px 35px rgba(116, 185, 255, 0.4);
              text-decoration: none;
              color: white;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-top: 30px;
            }
            
            .info-card {
              background: rgba(255, 255, 255, 0.7);
              padding: 20px;
              border-radius: 15px;
              border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .info-card h3 {
              color: #2c3e50;
              margin-bottom: 10px;
              font-size: 1.1rem;
            }
            
            .info-card p {
              color: #7f8c8d;
              font-size: 0.9rem;
            }
            
            .footer {
              margin-top: 40px;
              color: #95a5a6;
              font-size: 0.9rem;
            }
            
            @media (max-width: 768px) {
              .container {
                padding: 20px;
                margin: 20px;
              }
              
              h1 {
                font-size: 2rem;
              }
              
              .logo {
                font-size: 3rem;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🚀</div>
            <h1>Torunoğlu Backend API</h1>
            <p class="subtitle">Modern, Scalable & Secure Backend Service</p>
            
            <div class="status-badge">
              ✅ System Online & Running
            </div>
            
            <div class="docs-section">
              <h2 class="docs-title">📚 API Documentation</h2>
              <p style="margin-bottom: 25px; color: #7f8c8d;">
                Explore our comprehensive API documentation and test endpoints
              </p>
              
              <a href="/swagger" class="swagger-button" target="_blank">
                📖 Swagger UI
              </a>
              
              <a href="/redoc" class="redoc-button" target="_blank">
                📋 ReDoc
              </a>
            </div>
            
            <div class="info-grid">
              <div class="info-card">
                <h3>🔐 Authentication</h3>
                <p>JWT-based secure authentication system with role-based access control</p>
              </div>
              
              <div class="info-card">
                <h3>👥 Multi-tenant</h3>
                <p>Support for multiple tenants with isolated data and configurations</p>
              </div>
              
              <div class="info-card">
                <h3>🛡️ Security</h3>
                <p>Built with security best practices and comprehensive validation</p>
              </div>
              
              <div class="info-card">
                <h3>⚡ Performance</h3>
                <p>Optimized for high performance with MongoDB and caching</p>
              </div>
            </div>
            
            <div class="footer">
              <p>Developed by Bedirhan Say</p>
            </div>

           <div>
           Torunoğlu Backend API — © 2025 Torunoğlu Software
           </div>

          
          </div>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}
