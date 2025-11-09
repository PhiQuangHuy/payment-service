import { Injectable } from '@nestjs/common';
import {
  Repository,
  SelectQueryBuilder,
  ObjectLiteral,
} from 'typeorm';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import { Paginated } from '../interfaces/paginated.interface';

@Injectable()
export class PaginationProvider {
  /** Repository overload */
  async paginateQuery<T extends ObjectLiteral>(
    dto: PaginationQueryDto,
    repository: Repository<T>,
  ): Promise<Paginated<T>>;

  /** QueryBuilder overload */
  async paginateQuery<T extends ObjectLiteral>(
    dto: PaginationQueryDto,
    queryBuilder: SelectQueryBuilder<T>,
  ): Promise<Paginated<T>>;

  /** Implementation – works for both */
  async paginateQuery<T extends ObjectLiteral>(
    { page = 1, limit = 10 }: PaginationQueryDto,
    source: Repository<T> | SelectQueryBuilder<T>,
  ): Promise<Paginated<T>> {
    const skip = (page - 1) * limit;

    const resultsQb = source instanceof Repository
      ? source.createQueryBuilder('entity')
      : source.clone();

    const data = await resultsQb
      .skip(skip)
      .take(limit)
      .getMany();

    const countQb = source instanceof Repository
      ? source.createQueryBuilder('entity')
      : source.clone();

    const total = await countQb.skip(0).take(0).getCount();

    return {
      data,
      meta: {
        itemsPerPage: limit,
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}