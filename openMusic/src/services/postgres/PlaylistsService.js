const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistService {
  constructor(collaborationService, songsService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
    this._songsService = songsService;
  }

  async addPlaylist({ name, owner }) {
    const id = nanoid(16);

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlaylist(owner) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username
      FROM playlists
      LEFT JOIN collaborations
      ON collaborations.playlist_id = playlists.id
      LEFT JOIN users
      ON users.id = playlists.owner
      WHERE playlists.owner = $1 OR collaborations.user_id = $1`,
      values: [owner],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    const playlist = result.rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async addSongToPlaylist(songId, playlistId) {
    const id = nanoid(16);
    await this._songsService.getSongById(songId);
    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Playlist song gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getSongToPlaylist(id) {
    const query = {
      text: 'SELECT playlists.id, name, username FROM playlists inner join users on users.id = playlists.owner where playlists.id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('playlist tidak ditemukan');
    }
    const rowId = result.rows[0].id;
    const rowName = result.rows[0].name;
    const rowUsername = result.rows[0].username;
    const querySong = {
      text: 'SELECT ps.id, title, performer from playlist_songs ps LEFT JOIN songs s on ps.song_id = s.id where playlist_id = $1',
      values: [id],
    };
    const resultSong = await this._pool.query(querySong);
    let _songs = [];
    if (resultSong.rowCount) {
      _songs = resultSong.rows;
    }
    const getSongMap = {
      id: rowId, name: rowName, username: rowUsername, songs: _songs,
    };
    return getSongMap;
  }

  async deleteSongToPlaylist(id) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE song_id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist song gagal dihapus. Id tidak ditemukan');
    }
  }

  async addActivities(playlistId, songId, userId, action) {
    const id = nanoid(16);
    const time = new Date().toISOString();
    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, playlistId, songId, userId, action, time],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Activities gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getActivities(id) {
    const query = {
      text: 'SELECT username, title, action, time from playlist_song_activities psc inner join users u on psc.user_id = u.id inner join songs s on s.id = psc.song_id where playlist_id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    let _activities = [];
    if (result.rowCount) {
      _activities = result.rows;
    }
    const getActivitiesMap = {
      playlistId: id, activities: _activities,
    };
    return getActivitiesMap;
  }
}

module.exports = PlaylistService;
