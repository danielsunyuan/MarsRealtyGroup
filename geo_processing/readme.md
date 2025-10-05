# Mars geo processing

Utilities to prepare and "chop up" large Mars rasters into Cesium-ready XYZ tiles.

This folder contains `tiling.py`, which:

- Sets the Mars 2000 Sphere SRS (radius 3,396,190 m) and global bounds (-180, 90, 180, -90) on a source GeoTIFF
- Optionally rewrites the file as a tiled, compressed GeoTIFF for faster tiling
- Runs `gdal2tiles.py` in geodetic (`--xyz`) mode to generate web tiles for Cesium
- (Optional) uploads the resulting tiles to a Cloudflare R2 bucket via the AWS CLI

## Environments

- `environment.yml`: exported from your `geo` conda environment (`--from-history`)
- `requirements.txt`: pip-style freeze of the same environment

To create the environment with conda:

```
conda env create -f environment.yml
conda activate geo
```

Or with pip (use a virtualenv):

```
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Quick start

```
python tiling.py \
  --src MOLA_Hillshade_Geographic.tif \
  --work mola_work.tif \
  --tiles_out mola_xyz_geodetic \
  --zoom 0-8 \
  --resample bilinear \
  --compress jpeg
```

Notes:

- The script sets `PROJ_IGNORE_CELESTIAL_BODY=YES` so GDAL will not block transforms on non-Earth data.
- Default tile size follows `gdal2tiles.py` (256 px).
- Bounds are set to global Mars coverage: `-a_ullr -180 90 180 -90`.

## Optional: upload tiles to Cloudflare R2

```
python tiling.py \
  --src MOLA_Hillshade_Geographic.tif \
  --work mola_work.tif \
  --tiles_out mola_xyz_geodetic \
  --zoom 0-8 \
  --upload \
  --bucket <your-bucket> \
  --prefix mola_xyz_geodetic \
  --endpoint https://<your-account-id>.r2.cloudflarestorage.com \
  --public_dev_url https://<your-bucket>.<your-account-id>.r2.dev
```

After upload, you can test a sample tile in a browser, for example:

```
https://<your-bucket>.<your-account-id>.r2.dev/mola_xyz_geodetic/0/0/0.png
```

## Reference

- Mars SRS used: `+proj=longlat +a=3396190 +b=3396190 +no_defs`
- Tools: GDAL (`gdal_edit.py`, `gdal_translate`, `gdal2tiles.py`), optional AWS CLI

# Mars tile processing

Small utility to prepare and "chop up" large Mars rasters into Cesium-ready XYZ tiles.

This folder contains `tiling.py`, which:

- Stamps the Mars 2000 Sphere SRS (radius 3,396,190 m) and global bounds (-180, 90, 180, -90) onto a source GeoTIFF
- Optionally rewrites the file as a tiled, compressed GeoTIFF for faster tiling
- Runs `gdal2tiles.py` in geodetic (`--xyz`) mode to generate web tiles for Cesium
- (Optional) uploads the resulting tiles to a Cloudflare R2 bucket via the AWS CLI

## Prerequisites

- GDAL CLI tools in your PATH: `gdal_edit.py`, `gdal_translate`, `gdal2tiles.py`
- Optional for upload: `aws` (AWS CLI)
- Recommended: install GDAL via Conda (`conda-forge`). See `requirements.txt` for pip equivalents if you prefer pip.

## Quick start

Example end-to-end run using the defaults:

```
python tiling.py \
  --src MOLA_Hillshade_Geographic.tif \
  --work mola_work.tif \
  --tiles_out mola_xyz_geodetic \
  --zoom 0-8 \
  --resample bilinear \
  --compress jpeg
```

Notes:

- The script sets `PROJ_IGNORE_CELESTIAL_BODY=YES` so GDAL will not block transforms on non-Earth data.
- Default tile size follows `gdal2tiles.py` (256 px).
- Bounds are set to global Mars coverage: `-a_ullr -180 90 180 -90`.

## Optional: upload tiles to Cloudflare R2

```
python tiling.py \
  --src MOLA_Hillshade_Geographic.tif \
  --work mola_work.tif \
  --tiles_out mola_xyz_geodetic \
  --zoom 0-8 \
  --upload \
  --bucket <your-bucket> \
  --prefix mola_xyz_geodetic \
  --endpoint https://<your-account-id>.r2.cloudflarestorage.com \
  --public_dev_url https://<your-bucket>.<your-account-id>.r2.dev
```

After upload, you can test a sample tile in a browser, for example:

```
https://<your-bucket>.<your-account-id>.r2.dev/mola_xyz_geodetic/0/0/0.png
```

## Reference

- Mars SRS used: `+proj=longlat +a=3396190 +b=3396190 +no_defs`
- Tools: GDAL (`gdal_edit.py`, `gdal_translate`, `gdal2tiles.py`), optional AWS CLI


