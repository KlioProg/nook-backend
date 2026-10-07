import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard.js';
import { CurrentUser } from '../users/current-user.decorator.js';
import type { PublicUser } from '../users/user-view.js';
import { FavoritesService } from './favorites.service.js';
import { FavoriteResponseDto } from './dto/favorite-response.dto.js';

@ApiTags('Favorites')
@ApiBearerAuth()
@ApiBadRequestResponse({ description: 'Invalid spot ID or pagination' })
@ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  @ApiOkResponse({ type: FavoriteResponseDto, isArray: true })
  findAll(@CurrentUser() user: PublicUser, @Query() query: PaginationDto) {
    return this.favorites.findAll(user.id, query);
  }

  @Post(':spotId')
  @ApiCreatedResponse({ type: FavoriteResponseDto })
  @ApiNotFoundResponse({ description: 'Spot does not exist or is inactive' })
  add(
    @CurrentUser() user: PublicUser,
    @Param('spotId', new ParseUUIDPipe()) spotId: string,
  ) {
    return this.favorites.addFavorite(user.id, spotId);
  }

  @Delete(':spotId')
  @HttpCode(204)
  @ApiNoContentResponse({
    description: 'Favorite removed; also succeeds if already absent',
  })
  remove(
    @CurrentUser() user: PublicUser,
    @Param('spotId', new ParseUUIDPipe()) spotId: string,
  ) {
    return this.favorites.removeFavorite(user.id, spotId);
  }
}
