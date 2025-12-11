package screenshot

import (
	"bytes"
	"encoding/base64"
	"image"
	"image/png"

	"github.com/kbinani/screenshot"
	"golang.org/x/image/draw"
)

// CaptureResult holds the screenshot data
type CaptureResult struct {
	Width  int    `json:"width"`
	Height int    `json:"height"`
	Data   string `json:"data"` // Base64 encoded PNG
}

// CaptureFullscreen captures the display where the cursor is currently located
func CaptureFullscreen() (*CaptureResult, error) {
	displayIndex := GetMonitorAtCursor()
	bounds := screenshot.GetDisplayBounds(displayIndex)
	img, err := screenshot.CaptureRect(bounds)
	if err != nil {
		return nil, err
	}
	return encodeImage(img)
}

// CaptureActiveDisplay captures the display where the cursor is located and returns display info
func CaptureActiveDisplay() (*CaptureResult, int, error) {
	displayIndex := GetMonitorAtCursor()
	bounds := screenshot.GetDisplayBounds(displayIndex)
	img, err := screenshot.CaptureRect(bounds)
	if err != nil {
		return nil, displayIndex, err
	}
	result, err := encodeImage(img)
	return result, displayIndex, err
}

// CaptureRegion captures a specific region of the screen
func CaptureRegion(x, y, width, height int) (*CaptureResult, error) {
	img, err := screenshot.Capture(x, y, width, height)
	if err != nil {
		return nil, err
	}
	return encodeImage(img)
}

// CaptureDisplay captures a specific display by index
func CaptureDisplay(displayIndex int) (*CaptureResult, error) {
	bounds := screenshot.GetDisplayBounds(displayIndex)
	img, err := screenshot.CaptureRect(bounds)
	if err != nil {
		return nil, err
	}
	return encodeImage(img)
}

// GetDisplayCount returns the number of active displays
func GetDisplayCount() int {
	return screenshot.NumActiveDisplays()
}

// GetDisplayBounds returns the bounds of a display
func GetDisplayBounds(displayIndex int) image.Rectangle {
	return screenshot.GetDisplayBounds(displayIndex)
}

// CaptureDisplayThumbnail captures a thumbnail preview of a display
// Returns a scaled-down version suitable for preview in UI
func CaptureDisplayThumbnail(displayIndex int, maxWidth, maxHeight int) (*CaptureResult, error) {
	bounds := screenshot.GetDisplayBounds(displayIndex)
	img, err := screenshot.CaptureRect(bounds)
	if err != nil {
		return nil, err
	}

	originalWidth := img.Bounds().Dx()
	originalHeight := img.Bounds().Dy()

	// Calculate thumbnail size maintaining aspect ratio
	thumbWidth := maxWidth
	thumbHeight := maxHeight
	aspectRatio := float64(originalWidth) / float64(originalHeight)

	if float64(thumbWidth)/float64(thumbHeight) > aspectRatio {
		thumbWidth = int(float64(thumbHeight) * aspectRatio)
	} else {
		thumbHeight = int(float64(thumbWidth) / aspectRatio)
	}

	if thumbWidth < 1 {
		thumbWidth = 1
	}
	if thumbHeight < 1 {
		thumbHeight = 1
	}

	// Scale image
	thumbnail := image.NewRGBA(image.Rect(0, 0, thumbWidth, thumbHeight))
	draw.CatmullRom.Scale(thumbnail, thumbnail.Bounds(), img, img.Bounds(), draw.Over, nil)

	return encodeImage(thumbnail)
}

// encodeImage converts an image to base64 PNG
func encodeImage(img *image.RGBA) (*CaptureResult, error) {
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return nil, err
	}

	return &CaptureResult{
		Width:  img.Bounds().Dx(),
		Height: img.Bounds().Dy(),
		Data:   base64.StdEncoding.EncodeToString(buf.Bytes()),
	}, nil
}
