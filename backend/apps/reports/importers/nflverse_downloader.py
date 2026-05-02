# backend/apps/reports/importers/nflverse_downloader.py

from pathlib import Path
from typing import Optional
import requests


GITHUB_RELEASE_API = ("https://api.github.com/repos/nflverse/nflverse-data/releases/tags/{tag}")


class NflverseDownloadError(Exception):
    pass


def get_release_assets(tag: str) -> list[dict]:
    response = requests.get(
        GITHUB_RELEASE_API.format(tag=tag),
        headers={
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        timeout=30,
    )

    if response.status_code != 200:
        raise NflverseDownloadError(
            f"Failed to fetch release '{tag}'. "
            f"Status={response.status_code}, Body={response.text[:300]}"
        )

    release_data = response.json()
    return release_data.get("assets", [])


def find_asset_url(
    tag: str,
    contains: str,
    extension: str = ".csv",
) -> tuple[str, str]:
    assets = get_release_assets(tag)

    for asset in assets:
        name = asset.get("name", "")
        download_url = asset.get("browser_download_url", "")

        if contains in name and name.endswith(extension) and download_url:
            return name, download_url

    available = [asset.get("name", "") for asset in assets[:20]]
    raise NflverseDownloadError(
        f"No asset found for tag='{tag}', contains='{contains}', "
        f"extension='{extension}'. Sample available assets: {available}"
    )


def download_asset(
    tag: str,
    contains: str,
    output_dir: str | Path,
    extension: str = ".csv",
) -> Path:
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    filename, download_url = find_asset_url(
        tag=tag,
        contains=contains,
        extension=extension,
    )

    destination = output_path / filename

    with requests.get(download_url, stream=True, timeout=120) as response:
        response.raise_for_status()

        with destination.open("wb") as file:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    file.write(chunk)

    return destination