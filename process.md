# NestJS Refactoring Plan - CQRS Pattern Implementation

## Proje Analizi Özeti

### Mevcut Durum

- **Mimari**: Monolithic, service-based, Mongoose model injection
- **Module Yapısı**: 13 modül (Auth, Users, Companies, Categories, Customers, Employee, Expense, Fuel, Income, Payments, Reports, Vehicles, Logger)
- **Data Access**: Doğrudan Mongoose model injection (Repository pattern yok)
- **CQRS**: Uygulanmamış
- **Bağımlılıklar**: Cross-module dependencies

### Hedef Mimari

- **Domain Separation**: Core ve Accounting ana modülleri
- **CQRS Pattern**: Tüm işlemler Command/Query üzerinden
- **Basit Yapı**: Her modül kendi içinde commands, queries, handlers, controller, schema
- **SOLID Principles**: Handler'lar single responsibility
- **NestJS Best Practices**: Module organization, dependency injection

---

## Yeni Klasör Yapısı

```
src/
├── core/                          # Core Domain Modülleri
│   ├── auth/
│   │   ├── commands/
│   │   │   ├── handlers/
│   │   │   │   ├── login.handler.ts
│   │   │   │   └── register.handler.ts
│   │   │   ├── login.command.ts
│   │   │   └── register.command.ts
│   │   ├── queries/
│   │   │   └── handlers/ (gerekirse)
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   └── register.dto.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.schema.ts (Mongoose)
│   │   └── auth.module.ts
│   ├── users/
│   │   ├── commands/
│   │   │   ├── handlers/
│   │   │   │   ├── create-user.handler.ts
│   │   │   │   ├── update-user.handler.ts
│   │   │   │   └── delete-user.handler.ts
│   │   │   ├── create-user.command.ts
│   │   │   ├── update-user.command.ts
│   │   │   └── delete-user.command.ts
│   │   ├── queries/
│   │   │   ├── handlers/
│   │   │   │   ├── get-user.handler.ts
│   │   │   │   └── list-users.handler.ts
│   │   │   ├── get-user.query.ts
│   │   │   └── list-users.query.ts
│   │   ├── dto/
│   │   ├── users.controller.ts
│   │   ├── user.schema.ts
│   │   └── users.module.ts
│   ├── companies/
│   └── logger/
│   └── core.module.ts
│
├── accounting/                    # Accounting Domain Modülleri
│   ├── categories/
│   │   ├── commands/
│   │   │   ├── handlers/
│   │   │   ├── create-category.command.ts
│   │   │   └── ...
│   │   ├── queries/
│   │   │   ├── handlers/
│   │   │   └── ...
│   │   ├── dto/
│   │   ├── categories.controller.ts
│   │   ├── categories.schema.ts
│   │   └── categories.module.ts
│   ├── customers/
│   ├── employees/
│   ├── vehicles/
│   ├── expenses/
│   ├── incomes/
│   ├── fuel/
│   ├── payments/
│   ├── reports/
│   └── accounting.module.ts
│
├── shared/                        # Shared Utilities
│   ├── dto/
│   │   ├── command-response.dto.ts
│   │   ├── paginated-response.dto.ts
│   │   └── base-response.dto.ts
│   ├── helpers/
│   │   ├── filter.builder.ts
│   │   ├── object.id.ts
│   │   └── ...
│   ├── guards/
│   │   ├── jwt.guard.ts
│   │   └── company-id.guard.ts
│   ├── decorators/
│   ├── interceptors/
│   │   └── global.exception.ts
│   └── shared.module.ts (sadece DTOs, helpers, guards export eder - CqrsModule her modülde ayrı import edilir)
│
├── app.module.ts
└── main.ts
```

---

## Refactoring Adımları

### ✅ Faz 0: Hazırlık ve Analiz

- [x] Proje analizi tamamlandı
- [x] Domain ayrımı belirlendi
- [x] Basitleştirilmiş refactoring planı oluşturuldu

---

### 🔄 Faz 1: CQRS Paketi Kurulumu ve Yapılandırma

#### 1.1. Paket Kurulumu

- [x] `@nestjs/cqrs` paketi kuruldu
- [ ] Shared module'de CqrsModule import edilecek

#### 1.2. Shared Module

- [ ] `src/shared/shared.module.ts` - CqrsModule export eder (her domain modülü kendi import edecek)

---

### 🔄 Faz 2: Shared Utilities Migration

#### 2.1. DTOs

- [x] `src/shared/dto/command-response.dto.ts` (taşındı)
- [x] `src/shared/dto/paginated-response.dto.ts` (taşındı)
- [x] `src/shared/dto/base-response.dto.ts` (taşındı)
- [x] `src/shared/dto/pagination.request.dto.ts` (taşındı)

#### 2.2. Helpers

- [x] `src/shared/helpers/filter.builder.ts` (taşındı)
- [x] `src/shared/helpers/object.id.ts` (taşındı)
- [x] `src/shared/helpers/excel.helper.ts` (taşındı)
- [x] `src/shared/helpers/date-timezone.ts` (taşındı)
- [x] `src/shared/helpers/date.ts` (taşındı)

#### 2.3. Guards & Decorators

- [x] `src/shared/guards/jwt.guard.ts` (taşındı)
- [x] `src/shared/guards/company-id.guard.ts` (taşındı)
- [x] `src/shared/decorators/company.id.ts` (taşındı)
- [x] `src/shared/decorators/swagger/` (taşındı)

#### 2.4. Interceptors

- [x] `src/shared/interceptors/global.exception.ts` (taşındı)

#### 2.5. Shared Module

- [x] `src/shared/shared.module.ts` oluşturuldu

#### 2.6. TypeScript Path Mapping

- [x] `tsconfig.json`'a `@shared/*`, `@core/*`, `@accounting/*` path mappings eklendi
- [x] Tüm import path'leri `@shared` kullanacak şekilde güncellendi

---

### 🔄 Faz 3: Core Domain - Users Module

#### 3.1. Commands

- [x] `src/core/users/commands/create-user.command.ts`
- [x] `src/core/users/commands/update-user.command.ts`
- [x] `src/core/users/commands/delete-user.command.ts`

#### 3.2. Command Handlers

- [x] `src/core/users/commands/handlers/create-user.handler.ts` (Mongoose model kullanır)
- [x] `src/core/users/commands/handlers/update-user.handler.ts`
- [x] `src/core/users/commands/handlers/delete-user.handler.ts`

#### 3.3. Queries

- [x] `src/core/users/queries/get-user.query.ts`
- [x] `src/core/users/queries/list-users.query.ts`

#### 3.4. Query Handlers

- [x] `src/core/users/queries/handlers/get-user.handler.ts`
- [x] `src/core/users/queries/handlers/list-users.handler.ts`

#### 3.5. Controller & Module

- [x] `src/core/users/users.controller.ts` - Command/Query bus kullanır
- [x] `src/core/users/user.schema.ts` (taşındı)
- [x] `src/core/users/dto/` (taşındı)
- [x] `src/core/users/users.module.ts` - Handlers ve Controller register ✅

#### 3.6. Auth Module

- [x] `src/core/auth/commands/login.command.ts`
- [x] `src/core/auth/commands/register.command.ts`
- [x] `src/core/auth/commands/handlers/` - Login ve Register handlers
- [x] `src/core/auth/auth.controller.ts` - CommandBus kullanır
- [x] `src/core/auth/auth.module.ts` ✅

#### 3.7. Companies Module

- [x] `src/core/companies/commands/` - Create, Update, Delete commands
- [x] `src/core/companies/commands/handlers/` - Tüm command handlers
- [x] `src/core/companies/queries/` - Get, List queries
- [x] `src/core/companies/queries/handlers/` - Tüm query handlers
- [x] `src/core/companies/companies.controller.ts` - Command/Query bus kullanır
- [x] `src/core/companies/companies.module.ts` ✅

---

### 🔄 Faz 4: Core Domain - Auth Module

#### 4.1. Commands

- [ ] `src/core/auth/commands/login.command.ts`
- [ ] `src/core/auth/commands/register.command.ts`

#### 4.2. Command Handlers

- [ ] `src/core/auth/commands/handlers/login.handler.ts`
- [ ] `src/core/auth/commands/handlers/register.handler.ts`

#### 4.3. Controller & Module

- [ ] `src/core/auth/auth.controller.ts` - Command bus kullanır
- [ ] `src/core/auth/dto/` (taşı)
- [ ] `src/core/auth/auth.module.ts`
- [ ] JWT strategy dosyası taşı

---

### 🔄 Faz 5: Core Domain - Companies Module

#### 5.1. Commands & Handlers

- [ ] Create, Update, Delete commands ve handlers

#### 5.2. Queries & Handlers

- [ ] Get, List queries ve handlers

#### 5.3. Controller & Module

- [ ] `src/core/companies/companies.controller.ts`
- [ ] `src/core/companies/company.schema.ts` (taşı)
- [ ] `src/core/companies/dto/` (taşı)
- [ ] `src/core/companies/companies.module.ts`

---

### 🔄 Faz 6: Core Domain - Logger Module

#### 6.1. Command & Handler

- [ ] `src/core/logger/commands/log-error.command.ts`
- [ ] `src/core/logger/commands/handlers/log-error.handler.ts`

#### 6.2. Service (Infrastructure concern olarak kalabilir)

- [ ] `src/core/logger/logger.service.ts` - Command bus kullanarak log-error command gönderir

#### 6.3. Module

- [ ] `src/core/logger/logger.module.ts`

---

### 🔄 Faz 7: Core Module Aggregation

- [ ] `src/core/core.module.ts` - Tüm core modüllerini import/export eder

---

### 🔄 Faz 8: Accounting Domain - Categories Module

#### 8.1. Commands & Handlers

- [ ] Create, Update, Delete commands ve handlers

#### 8.2. Queries & Handlers

- [ ] Get, List queries ve handlers

#### 8.3. Controller & Module

- [x] `src/modules/accounting/categories/categories.controller.ts` ✅
- [x] `src/modules/accounting/categories/categories.schema.ts` ✅
- [x] `src/modules/accounting/categories/dto/` ✅
- [x] `src/modules/accounting/categories/categories.module.ts` ✅

---

### 🔄 Faz 9: Accounting Domain - Diğer Modüller

Her modül için aynı pattern:

- [ ] Customers
- [ ] Employees
- [ ] Vehicles
- [ ] Expenses
- [ ] Incomes
- [ ] Fuel
- [ ] Payments
- [ ] Reports (sadece queries olabilir)

---

### 🔄 Faz 10: Accounting Module Aggregation

- [ ] `src/accounting/accounting.module.ts` - Tüm accounting modüllerini import/export eder

---

### 🔄 Faz 11: App Module Refactoring

- [ ] `src/app.module.ts` - Core ve Accounting module'leri import eder
- [ ] Shared module global veya import edilir

---

### 🔄 Faz 12: Controller Refactoring

Tüm controller'larda:

- [ ] Service injection kaldır
- [ ] CommandBus ve QueryBus inject et
- [ ] Endpoint'ler command/query gönderecek şekilde değiştir

---

### 🔄 Faz 13: Eski Dosyaları Temizleme

- [ ] `src/modules/` klasörü kaldır
- [ ] `src/common/` klasörü kaldır
- [ ] Import path'leri güncelle

---

### 🔄 Faz 14: Testing

- [ ] Her handler için unit test
- [ ] Controller integration test
- [ ] End-to-end test

---

## Command/Query Pattern Örnekleri

### Command Örneği:

```typescript
// commands/create-user.command.ts
import { ICommand } from '@nestjs/cqrs';

export class CreateUserCommand implements ICommand {
  constructor(
    public readonly username: string,
    public readonly email: string,
    public readonly password: string
  ) {}
}

// commands/handlers/create-user.handler.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '../create-user.command';
import { User, UserDocument } from '../user.schema';
import { Model } from 'mongoose';
import { CommandResponseDto } from '@shared/dto';

@Injectable()
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async execute(command: CreateUserCommand): Promise<CommandResponseDto> {
    const user = new this.userModel({
      username: command.username,
      email: command.email,
      password: command.password,
    });
    const saved = await user.save();

    return {
      statusCode: 201,
      id: saved._id.toString(),
    };
  }
}
```

### Query Örneği:

```typescript
// queries/get-user.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetUserQuery implements IQuery {
  constructor(public readonly id: string) {}
}

// queries/handlers/get-user.handler.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserQuery } from '../get-user.query';
import { User, UserDocument } from '../user.schema';
import { Model } from 'mongoose';
import { UserDto } from '../dto/user.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery, UserDto> {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async execute(query: GetUserQuery): Promise<UserDto> {
    const user = await this.userModel.findById(query.id).lean().exec();
    if (!user) throw new NotFoundException('User not found');

    return plainToInstance(UserDto, user);
  }
}
```

### Controller Örneği:

```typescript
// users.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserCommand } from './commands/create-user.command';
import { GetUserQuery } from './queries/get-user.query';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const command = new CreateUserCommand(dto.username, dto.email, dto.password);
    return this.commandBus.execute(command);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const query = new GetUserQuery(id);
    return this.queryBus.execute(query);
  }
}
```

---

## İlerleme Takibi

**Son Güncelleme**: 2024-12-07
**Toplam Faz**: 14
**Tamamlanan**: Faz 1-3 (Shared, Users, Auth, Companies)
**İlerleme**: ~25%

### ✅ Tamamlanan İşler:

1. ✅ Shared infrastructure oluşturuldu (@nestjs/cqrs kullanıldı)
2. ✅ TypeScript path mappings (@shared, @core, @accounting)
3. ✅ Users modülü CQRS pattern'e göre refactor edildi
4. ✅ Auth modülü CQRS pattern'e göre refactor edildi
5. ✅ Companies modülü CQRS pattern'e göre refactor edildi
6. ✅ Build başarılı - tüm import path'leri çalışıyor
