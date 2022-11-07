const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapDBToModelAlbum } = require('../../utils');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $4) RETURNING id',
      values: [id, name, year, createdAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbums() {
    const result = await this._pool.query('SELECT * FROM albums');
    return result.rows.map(mapDBToModelAlbum);
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT id, name, year, cover FROM albums where id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }
    const rowId = result.rows.map(mapDBToModelAlbum)[0].id;
    const rowName = result.rows.map(mapDBToModelAlbum)[0].name;
    const rowYear = result.rows.map(mapDBToModelAlbum)[0].year;
    const rowCover = result.rows[0].cover;
    const querySong = {
      text: 'SELECT id, title, performer FROM songs where album_id = $1',
      values: [rowId],
    };
    const resultSong = await this._pool.query(querySong);
    let _songs = [];
    if (resultSong.rowCount) {
      _songs = resultSong.rows;
    }
    const getAlbumMap = {
      id: rowId, name: rowName, year: rowYear, coverUrl: rowCover, songs: _songs,
    };
    return getAlbumMap;
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums set name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Gagal update, id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums where id = $1 RETURNING id',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Catatan gagal dihapus. Id tidak ditemukan');
    }
  }

  async editAlbumCoverById(id, path) {
    const query = {
      text: 'UPDATE albums SET cover = $1 WHERE id = $2 RETURNING id',
      values: [path, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan.');
    }
  }

  async addAlbumLikeById(albumId, userId) {
    const id = `like-${nanoid(16)}`;

    const queryCheckLike = {
      text: `SELECT id FROM user_album_likes 
      WHERE user_id = $1 AND album_id = $2`,
      values: [userId, albumId],
    };

    const resultCheck = await this._pool.query(queryCheckLike);

    if (!resultCheck.rows.length) {
      const query = {
        text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
        values: [id, userId, albumId],
      };

      const result = await this._pool.query(query);

      if (!result.rows[0].id) {
        throw new InvariantError('Gagal menambahkan like');
      }
    } else {
      await this.deleteAlbumLikeById(albumId, userId);
    }

    await this._cacheService.delete(`album-likes:${albumId}`);
  }

  async deleteAlbumLikeById(albumId, userId) {
    const query = {
      text: `DELETE FROM user_album_likes 
      WHERE user_id = $1 AND album_id = $2 
      RETURNING id`,
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal menghapus like');
    }
  }

  async getAlbumLikesById(albumId) {
    try {
      const result = await this._cacheService.get(`album-likes:${albumId}`);
      const likes = parseInt(result, 10);
      return {
        cache: true,
        likes,
      };
    } catch (error) {
      const query = {
        text: 'SELECT COUNT(id) FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);

      if (!result.rows.length) {
        throw new NotFoundError('Gagal mengambil like');
      }

      const likes = parseInt(result.rows[0].count, 10);

      await this._cacheService.set(`album-likes:${albumId}`, likes);
      return {
        cache: false,
        likes,
      };
    }
  }
}

module.exports = AlbumsService;
