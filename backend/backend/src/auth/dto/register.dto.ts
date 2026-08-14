import { CreateEmployeDto } from '../../employe/dto/create-employe.dto';
//Hérite de CreateEmployeDto pour ajouter les propriétés nécessaires à l'inscription d'un employé
export class RegisterDto extends CreateEmployeDto {}
