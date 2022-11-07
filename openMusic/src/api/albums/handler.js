const autoBind = require('auto-bind');
const config = require('../../utils/config');

class AlbumsHandler {
  constructor(albumsService, storageService, validator) {
    this._albumsService = albumsService;
    this._storageService = storageService;
    this._validator = validator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);

    const albumId = await this._albumsService.addAlbum(request.payload);

    return h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: {
        albumId,
      },
    }).code(201);
  }

  async getAlbumsHandler() {
    const albums = await this._albumsService.getAlbums();
    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._albumsService.getAlbumById(id);
    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._albumsService.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._albumsService.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postUploadImageHandler(request, h) {
    const { cover } = request.payload;
    this._validator.validateImageHeaders(cover.hapi.headers);
    const { id } = request.params;
    const filename = await this._storageService.writeFile(cover, cover.hapi);
    const fileLocation = `http://${config.app.host}:${config.app.port}/albums/images/${filename}`;
    await this._albumsService.editAlbumCoverById(id, fileLocation);

    return h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    }).code(201);
  }

  async postLikeAlbumByIdHandler(request, h) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._albumsService.getAlbumById(albumId);
    await this._albumsService.addAlbumLikeById(albumId, userId);

    return h.response({
      status: 'success',
      message: 'Operasi berhasil dilakukan',
    }).code(201);
  }

  async getAlbumLikesByIdHandler(request, h) {
    const { id } = request.params;
    const { cache, likes } = await this._albumsService.getAlbumLikesById(id);

    const response = h.response({
      status: 'success',
      data: {
        likes,
      },
    });

    if (cache) response.header('X-Data-Source', 'cache');

    return response;
  }
}

module.exports = AlbumsHandler;
