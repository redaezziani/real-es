import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Length,
  Min,
} from 'class-validator';
import { currency, propertyType } from '@prisma/client';

export class CreatePropertyDto {
  @ApiProperty({
    description: 'Name of the property',
    example: 'Luxury Beachfront Villa',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @ApiProperty({
    description: 'Detailed description of the property',
    example: 'Beautiful 3-bedroom villa with ocean views...',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 1000)
  description: string;

  @ApiProperty({
    description: 'Price of the property',
    example: 500000,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Profile ID of the property owner',
    example: 'usr_123456789',
  })
  @IsString()
  @IsNotEmpty()
  profileId: string;

  @ApiProperty({
    description: 'Rating of the property (0-5)',
    example: 4.5,
    minimum: 0,
    maximum: 5,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(5)
  rate: number;

  @ApiProperty({
    description: 'Property location',
    example: 'Miami Beach, FL',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    description: 'Currency for the price',
    enum: currency,
    example: 'USD',
  })
  @IsEnum(currency)
  @IsNotEmpty()
  currency: currency;

  @ApiProperty({
    description: 'Type of property',
    enum: propertyType,
    example: 'APARTMENT',
  })
  @IsEnum(propertyType)
  @IsNotEmpty()
  type: propertyType;
}
