#!/usr/bin/env python3
"""
mars_tilemaker.py
- Set Mars 2000 Sphere SRS on a source TIFF
- (Optional) produce a tiled/compressed GeoTIFF
- Generate XYZ+Geodetic tiles with gdal2tiles (for Cesium)
- (Optional) upload to Cloudflare R2 via AWS CLI

Requirements:
  GDAL installed in PATH (gdal_edit.py, gdal_translate, gdal2tiles.py)
  (Optional) AWS CLI if using --upload

Example:
  python mars_tilemaker.py \
    --src MOLA_Hillshade_Geographic.tif \
    --work mars_work.tif \
    --tiles_out mars_xyz_geodetic \
    --zoom 0-8 \
    --resample bilinear \
    --compress jpeg \
    --upload --bucket nasa --prefix mars_xyz_geodetic \
    --endpoint https://d65f833aea37a27b96b9ecd6a5f4da47.r2.cloudflarestorage.com

Notes:
  - Uses Mars 2000 Sphere radius 3396190 m and (-180,90,180,-90) bounds.
  - Sets PROJ_IGNORE_CELESTIAL_BODY=YES so GDAL won’t complain (Earth vs Mars).
"""

import argparse
import os
import shlex
import subprocess
import sys
from pathlib import Path

MARS_PROJ4 = '+proj=longlat +a=3396190 +b=3396190 +no_defs'
MARS_BOUNDS = (-180, 90, 180, -90)  # ulx uly lrx lry

def run(cmd, env=None):
    print(f'→ {cmd}')
    proc = subprocess.run(cmd, shell=True, env=env)
    if proc.returncode != 0:
        sys.exit(proc.returncode)

def which_or_die(name):
    from shutil import which
    if which(name) is None:
        print(f'ERROR: {name} not found in PATH')
        sys.exit(1)

def build_parser():
    p = argparse.ArgumentParser(description='Make Cesium-ready XYZ tiles for Mars.')
    p.add_argument('--src', required=True, help='Input TIFF (unmodified source).')
    p.add_argument('--work', required=True,
                   help='Output GeoTIFF to be edited/translated (safe to overwrite).')
    p.add_argument('--tiles_out', required=True, help='Output XYZ tiles folder.')
    p.add_argument('--zoom', default='0-8', help='Zoom range for tiles, e.g. 0-8.')
    p.add_argument('--resample', default='bilinear',
                   choices=['nearest', 'bilinear', 'cubic', 'cubicspline', 'lanczos'],
                   help='Resampling for gdal2tiles.')
    p.add_argument('--compress', default='jpeg', choices=['jpeg', 'webp', 'none'],
                   help='Compression for the intermediate tiled GeoTIFF.')
    p.add_argument('--jpeg_quality', type=int, default=90, help='JPEG quality (if --compress jpeg).')
    p.add_argument('--webp_level', type=int, default=80, help='WEBP level (if --compress webp).')
    p.add_argument('--tile_size', type=int, default=256, help='Tile size (gdal2tiles default is 256).')
    # Upload options
    p.add_argument('--upload', action='store_true', help='Upload tiles to R2 with AWS CLI.')
    p.add_argument('--bucket', help='R2 bucket name (e.g., nasa).')
    p.add_argument('--prefix', help='Prefix inside bucket (e.g., mars_xyz_geodetic).')
    p.add_argument('--endpoint', help='R2 S3 endpoint URL.')
    p.add_argument('--public_dev_url', help='Optional: public .r2.dev URL to test.')
    return p

def main():
    args = build_parser().parse_args()

    # Check tools
    which_or_die('gdal_edit.py')
    which_or_die('gdal_translate')
    which_or_die('gdal2tiles.py')
    if args.upload:
        which_or_die('aws')
        if not (args.bucket and args.prefix and args.endpoint):
            print('ERROR: --upload requires --bucket, --prefix, and --endpoint')
            sys.exit(1)

    src = Path(args.src)
    work = Path(args.work)
    tiles_out = Path(args.tiles_out)
    tiles_out.mkdir(parents=True, exist_ok=True)

    # 1) Copy source → work (so we never mutate the original)
    if src.resolve() != work.resolve():
        run(f'cp {shlex.quote(str(src))} {shlex.quote(str(work))}')

    # 2) Stamp Mars SRS and global bounds
    ulx, uly, lrx, lry = MARS_BOUNDS
    run(
        f'gdal_edit.py -a_srs "{MARS_PROJ4}" -a_ullr {ulx} {uly} {lrx} {lry} {shlex.quote(str(work))}'
    )

    # 3) (Optional) translate to a tiled/compressed GeoTIFF for faster tiling
    #    We’ll overwrite `work` with a better-performing version.
    translate_cmd = ['gdal_translate', '-of', 'GTiff', '-co', 'TILED=YES']
    if args.compress == 'jpeg':
        translate_cmd += ['-co', 'COMPRESS=JPEG', '-co', f'JPEG_QUALITY={args.jpeg_quality}']
    elif args.compress == 'webp':
        translate_cmd += ['-co', 'COMPRESS=WEBP', '-co', f'WEBP_LEVEL={args.webp_level}']
    else:
        # no compression, but keep tiling + maybe LZW if you prefer:
        # translate_cmd += ['-co', 'COMPRESS=LZW']
        pass
    translate_cmd += [shlex.quote(str(work)), shlex.quote(str(work))]
    run(' '.join(translate_cmd))

    # 4) Generate XYZ geodetic tiles for Cesium
    #    Important: we set PROJ_IGNORE_CELESTIAL_BODY=YES so GDAL won’t block transforms.
    env = os.environ.copy()
    env['PROJ_IGNORE_CELESTIAL_BODY'] = 'YES'
    # gdal2tiles.py defaults to 256 tile size; you can pass --tilesize if needed.
    g2t = [
        'gdal2tiles.py',
        '-p', 'geodetic',
        '--xyz',
        '-z', args.zoom,
        '-r', args.resample,
        shlex.quote(str(work)),
        shlex.quote(str(tiles_out))
    ]
    # gdal2tiles doesn’t expose tile-size universally across builds; use default 256 unless you know you need different.
    run(' '.join(g2t), env=env)

    # 5) Optional upload to R2
    if args.upload:
        bucket = args.bucket
        prefix = args.prefix.rstrip('/')
        endpoint = args.endpoint
        run(
            f'aws s3 cp {shlex.quote(str(tiles_out))} s3://{bucket}/{prefix}/ '
            f'--recursive --endpoint-url {shlex.quote(endpoint)} '
            f'--cache-control "public, max-age=31536000, immutable"'
        )
        print('\nUpload complete.')
        if args.public_dev_url:
            sample = f'{args.public_dev_url.rstrip("/")}/{prefix}/0/0/0.png'
            print(f'Test a tile in the browser:\n  {sample}\n')

    print('\nDone. Tiles ready at:', tiles_out.resolve())

if __name__ == '__main__':
    main()