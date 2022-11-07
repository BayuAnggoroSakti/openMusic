/* eslint-disable max-len */
const Joi = require('joi');

const AlbumPayloadSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().integer().min(1900).required(),
});

const SongPayloadSchema = Joi.object({
  title: Joi.string().required(),
  year: Joi.number().integer().min(1900).required(),
  genre: Joi.string().required(),
  performer: Joi.string().required(),
  duration: Joi.number(),
  albumId: Joi.string(),
});

const PlaylistPayloadSchema = Joi.object({
  name: Joi.string().required(),
});

const PlaylistSongPayloadSchema = Joi.object({
  songId: Joi.string().required(),
});

const ImageHeadersSchema = Joi.object({
  'content-type': Joi.string().valid('image/apng', 'image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp').required(),
}).unknown();

module.exports = {
  AlbumPayloadSchema, SongPayloadSchema, PlaylistPayloadSchema, PlaylistSongPayloadSchema, ImageHeadersSchema,
};
