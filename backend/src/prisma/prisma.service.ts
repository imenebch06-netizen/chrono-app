import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
//Lancer une connexion à la base de données Prisma au démarrage du module et la fermer à la destruction du module.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  //La méthode onModuleInit est appelée lorsque le module est initialisé, et elle appelle la méthode $connect() de PrismaClient pour établir une connexion à la base de données.
  async onModuleInit() {
    await this.$connect();
  }
  //La méthode onModuleDestroy est appelée lorsque le module est détruit, et elle appelle la méthode $disconnect() de PrismaClient pour fermer la connexion à la base de données.
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
