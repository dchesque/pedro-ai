# Changelog

All notable changes to this project will be documented in this file.
 
## [1.2.0] - 2026-01-11
 
### Added
- **Shorts Pipeline**: Automated generation of short videos/reels.
- **Agente Roteirista**: Integration with Claude 3.5 Sonnet to create detailed scripts from a theme.
- **Agente Prompt Engineer**: Integration with Claude to optimize image prompts from script scenes.
- **Geração Batch**: Parallel generation of all short scenes using **Flux Schnell**.
- **Gestão de Shorts**: Interface to create, view, and delete shorts with status tracking.
- **Sistema de Créditos**: Advanced credit management for shorts (base cost + per scene).
- **Polling Automático**: Dashboard updates progress automatically while generating.
- Added `@radix-ui/react-slider` for duration selection.

## [1.1.3] - 2026-01-11

### Added
- Added image upload support in **VideoGenerationForm**.
- Image preview and removal functionality before video generation.
- URL fallback remains available for external image sources.
- Integrated with `/api/upload` endpoint for secure file handling.


## [1.1.2] - 2026-01-10

### Fixed
- Updated **Kling** model paths to include `/pro/` prefix (`fal-ai/kling-video/v2.5-turbo/pro/...`).


## [1.1.1] - 2026-01-10

### Changed
- Migrated **fal.ai** integration to the official SDK (`@fal-ai/client`).
- Refactored `FalClient` to use SDK-native `run` and `subscribe` methods.
- Optimized **Flux** (synchronous) and **Kling** (asynchronous) generation flows.


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
