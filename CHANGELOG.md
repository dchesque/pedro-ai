# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-01-10

### Added
- Integrated **fal.ai** for AI image and video generation.
- **Flux Schnell** module for fast image generation.
- **Kling 2.5 Turbo** module for high-quality video generation (text-to-video and image-to-video).
- New API routes: `/api/ai/fal/image` and `/api/ai/fal/video`.
- Credit system support for fal.ai features:
    - 1 credit per image.
    - 1 credit per second of video.
- Automatic credit deduction and refund on failure logic for fal.ai modules.

### Fixed
- Admin route `/api/admin/users/[id]/credits` now automatically creates a credit balance record if it doesn't exist (fixing 404 error).

## [1.0.1] - 2026-01-10

### Changed
- Updated default database volume name to `saas_pedro_ai` in Docker setup script and documentation.
- Updated default database container name to `saas_pedro_ai` in Docker setup script and documentation.
