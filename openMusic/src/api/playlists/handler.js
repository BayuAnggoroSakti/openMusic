const autoBind = require('auto-bind');

class PlaylistHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePlaylistPayload(request.payload);
    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;
    const playlistId = await this._service.addPlaylist({ name, owner: credentialId });

    return h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    }).code(201);
  }

  async getPlaylistHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this._service.getPlaylist(credentialId);
    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistByIdHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistOwner(id, credentialId);
    await this._service.deletePlaylistById(id);

    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  async postSongToPlaylistHandler(request, h) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { songId } = request.payload;
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._service.verifyPlaylistAccess(id, credentialId);
    const playlistId = await this._service.addSongToPlaylist(songId, id);
    await this._service.addActivities(id, songId, credentialId, 'add');
    return h.response({
      status: 'success',
      message: 'Playlist Song berhasil ditambahkan',
      data: {
        playlistId,
      },
    }).code(201);
  }

  async getSongToPlaylistHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._service.verifyPlaylistAccess(id, credentialId);
    const playlist = await this._service.getSongToPlaylist(id);
    return {
      status: 'success',
      data: {
        playlist,
      },
    };
  }

  async deleteSongToPlaylistHandler(request) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    const { songId } = request.payload;
    await this._service.verifyPlaylistAccess(id, credentialId);
    const playlist = await this._service.deleteSongToPlaylist(songId);
    await this._service.addActivities(id, songId, credentialId, 'delete');
    return {
      status: 'success',
      message: 'Playlist Song berhasil dihapus',
      data: {
        playlist,
      },
    };
  }

  async getActivitiesHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._service.verifyPlaylistAccess(id, credentialId);
    const activities = await this._service.getActivities(id);
    return {
      status: 'success',
      data: activities,
    };
  }
}

module.exports = PlaylistHandler;
