import { Ability, AbilityBuilder } from '@casl/ability';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma/runtime';
import { Injectable } from '@nestjs/common';
import { TCurrentUser } from 'src/auth/types/current-user.type';
import {
  Permission,
  Product,
  ProductCategory,
  Role,
  User,
  UserSession,
} from '../generated/prisma/client';

export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

export type AppSubjects = Subjects<{
  User: User;
  Product: Product;
  ProductCategory: ProductCategory;
  Role: Role;
  Permission: Permission;
  UserSession: UserSession;
}>;

type AppAbility = Ability<[Action, AppSubjects], PrismaQuery>;

@Injectable()
export class AbilityFactory {
  createUserAbility(currentUser: TCurrentUser) {
    const builder = new AbilityBuilder<AppAbility>(createPrismaAbility);

    builder.can(Action.Read, 'User');
    builder.can(Action.Create, 'User');
    builder.can(Action.Update, 'User');
    builder.can(Action.Delete, 'User');

    return builder.build();
  }
}
