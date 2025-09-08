// // ------------------------
// // user.service.ts
// // ------------------------
// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
// import { User } from '@/entity';
// import { type CrudRequest, ParsedBody, ParsedRequest } from '@nestjsx/crud';
// import * as bcrypt from 'bcrypt';
// import { UserDto } from '@/dto';

// @Injectable()
// export class UserService extends TypeOrmCrudService<User> {
//   constructor(@InjectRepository(User) userRepo) {
//     super(userRepo);
//   }

//   async createUser(
//     @ParsedRequest() req: CrudRequest,
//     @ParsedBody() dto: UserDto,
//   ) {
//     dto.password = await bcrypt.hash(dto.password, 10);
//     return this.createOne(req, dto);
//   }

//   async updateUser(
//     @ParsedRequest() req: CrudRequest,
//     @ParsedBody() dto: UserDto,
//   ) {
//     dto.password = await bcrypt.hash(dto.password, 10);
//     return this.updateOne(req, dto);
//   }
// }
