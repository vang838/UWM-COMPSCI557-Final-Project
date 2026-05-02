from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

from apps.reports.importers.nflverse_downloader import (
    NflverseDownloadError,
    download_asset,
    get_release_assets,
)


class Command(BaseCommand):
    help = "Download a CSV asset from the nflverse-data GitHub releases."

    def add_arguments(self, parser):
        parser.add_argument(
            "--tag",
            required=True,
            help="GitHub release tag, example: stats_player, teams, players, weekly_rosters",
        )

        parser.add_argument(
            "--contains",
            required=False,
            help="Substring that should appear in the target asset filename.",
        )

        parser.add_argument(
            "--extension",
            default=".csv",
            help="File extension to download. Default: .csv",
        )

        parser.add_argument(
            "--list",
            action="store_true",
            help="List matching release assets instead of downloading.",
        )

        parser.add_argument(
            "--output-dir",
            default="data/imports/nflverse",
            help="Directory where downloaded files should be saved.",
        )

    def handle(self, *args, **options):
        tag = options["tag"]
        contains = options.get("contains")
        extension = options["extension"]
        should_list = options["list"]
        output_dir = Path(settings.BASE_DIR) / options["output_dir"]

        try:
            if should_list:
                assets = get_release_assets(tag)

                matching_assets = [
                    asset.get("name", "")
                    for asset in assets
                    if asset.get("name", "").endswith(extension)
                ]

                if contains:
                    matching_assets = [
                        name for name in matching_assets if contains in name
                    ]

                if not matching_assets:
                    self.stdout.write(
                        self.style.WARNING(
                            f"No assets found for tag='{tag}', contains='{contains}', extension='{extension}'"
                        )
                    )
                    return

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Found {len(matching_assets)} matching asset(s):"
                    )
                )

                for name in matching_assets[:50]:
                    self.stdout.write(f" - {name}")

                if len(matching_assets) > 50:
                    self.stdout.write(f"...and {len(matching_assets) - 50} more")

                return

            if not contains:
                raise CommandError("--contains is required unless --list is used")

            downloaded_path = download_asset(
                tag=tag,
                contains=contains,
                extension=extension,
                output_dir=output_dir,
            )

            self.stdout.write(
                self.style.SUCCESS(f"Downloaded nflverse asset to: {downloaded_path}")
            )

        except NflverseDownloadError as error:
            raise CommandError(str(error)) from error
        except Exception as error:
            raise CommandError(f"Unexpected download error: {error}") from error