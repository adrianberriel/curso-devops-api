import { IsNotEmpty, IsNumber, IsPositive, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsString()
  @MaxLength(200)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(1_000_000)
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;
}
