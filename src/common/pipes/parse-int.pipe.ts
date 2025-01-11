import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntWithDefaultPipe implements PipeTransform<string, number> {
  constructor(private readonly defaultValue: number = 0) {}

  transform(value: string): number {
    if (!value) return this.defaultValue;

    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException(
        'Validation failed (numeric string is expected)',
      );
    }
    return val;
  }
}
