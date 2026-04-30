import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { AxiosError } from 'axios';

export function handleHttpError(error: unknown, logger: Logger): never {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const message = error.response?.data?.message ?? error.message;

    logger.error(`MetaApi HTTP error: ${status} — ${message}`, error.stack);

    if (error.code === 'ECONNABORTED') {
      throw new RequestTimeoutException('MetaApi request timed out');
    }

    switch (status) {
      case 400:
        throw new BadRequestException(message);
      case 401:
        throw new UnauthorizedException(
          'Invalid or expired MetaApi credentials',
        );
      case 403:
        throw new ForbiddenException(message);
      case 404:
        throw new NotFoundException(message);
      case 429:
        throw new HttpException('MetaApi rate limit exceeded', 429);
      default:
        if (status && status >= 500) {
          throw new InternalServerErrorException(message);
        }
        throw new InternalServerErrorException(
          `Unexpected MetaApi error: ${message}`,
        );
    }
  }

  logger.error('Unknown MetaApi error', error);
  throw new InternalServerErrorException('Unknown MetaApi error');
}
