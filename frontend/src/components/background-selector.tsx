import { ChevronDownIcon } from "lucide-react";
import { useState, useEffect } from "react";

export type BackgroundType = "transparent" | "solid" | "gradient" | "image";

interface BackgroundSelectorProps {
  backgroundColor: string;
  onBackgroundChange: (value: string) => void;
  onBackgroundTypeChange?: (type: BackgroundType) => void;
}

// Transparent pattern SVG data URL
const TRANSPARENT_PATTERN =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmYiLz48cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZGRkIi8+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=";

// Solid colors (from bg.html expanded section)
const SOLID_COLORS = [
  "#f8f9fa",
  "#dee2e6",
  "#adb5bd",
  "#495057",
  "#212529",
  "#151617",
  "#ff5962",
  "#ff924c",
  "#ffca3a",
  "#c5ca30",
  "#8ac926",
  "#3fc95d",
  "#ffadad",
  "#ffc2a9",
  "#ffd6a5",
  "#fdffb6",
  "#caffbf",
  "#c3ffd0",
  "#36949d",
  "#1982c4",
  "#4267ac",
  "#565aa0",
  "#6a4c93",
  "#ee4b86",
  "#b4fbdf",
  "#aae0ef",
  "#a0c4ff",
  "#bdb2ff",
  "#ffc6ff",
  "#ffc7ec",
];

// Gradient categories (organized and expanded, duplicates removed)
const GRADIENT_CATEGORIES = {
  vibrant: [
    "linear-gradient(140deg, #ff6432 12.8%, #ff0065 43.52%, #7b2eff 84.34%)",
    "linear-gradient(140deg, #f4e5f0, #e536ab, #5c03bc, #0e0725)",
    "linear-gradient(135deg, #eeddf3, #ee92b1, #6330b4)",
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)",
  ],
  pastel: [
    "linear-gradient(113.96deg, #45bee8 13.54%, #d6a1ac 50%, #e88c5d 85.42%)",
    "linear-gradient(113.96deg, #45e99f 11.98%, #d5a89b 50%, #e84698 85.42%)",
    "linear-gradient(113.96deg, #45dfe8 11.98%, #d3aaaf 50%, #e86764 85.42%)",
    "linear-gradient(293.96deg, #a0e97d 11.46%, #a9cbb1 50%, #c080e8 88.54%)",
    "linear-gradient(135deg, #d7ebeb, #f4afe9, #9d7ef3)",
    "linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)",
    "linear-gradient(135deg, #a8caba 0%, #5d4e75 100%)",
    "linear-gradient(135deg, #ffd89b 0%, #19547b 100%)",
    "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
    "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
  ],
  dark: [
    "linear-gradient(135deg, #303030, #101010)",
    "linear-gradient(-45deg, #3d4e81 0%, #5753c9 48%, #6e7ff3 100%)",
    "linear-gradient(-45deg, #505285 0%, #585e92 12%, #65689f 25%, #7474b0 37%, #7e7ebb 50%, #8389c7 62%, #9795d4 75%, #a2a1dc 87%, #b5aee4 100%)",
    "linear-gradient(135deg, #0c0c0c 0%, #2d3436 100%)",
    "linear-gradient(135deg, #232526 0%, #414345 100%)",
    "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
    "linear-gradient(135deg, #16222a 0%, #3a6073 100%)",
    "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
  ],
  cool: [
    "linear-gradient(135deg, #0acffe, #4956ff)",
    "linear-gradient(-45deg, #727a9a, #d8dbe9)",
    "linear-gradient(135deg, #81ecec 0%, #74b9ff 100%)",
    "linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)",
    "linear-gradient(135deg, #0984e3 0%, #2d3436 100%)",
    "linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)",
    "linear-gradient(135deg, #0093e5 0%, #80d0c7 100%)",
    "linear-gradient(135deg, #4158d0 0%, #c850c0 100%)",
    "linear-gradient(135deg, #8bc6ec 0%, #9599e2 100%)",
    "linear-gradient(135deg, #21d4fd 0%, #b721ff 100%)",
  ],
  warm: [
    "linear-gradient(135deg, #c6ffdd, #fbd786, #f7797d)",
    "linear-gradient(135deg, #f8d081, #ee8144)",
    "linear-gradient(-45deg, #f83600 0%, #f9d423 100%)",
    "linear-gradient(135deg, #fad961 0%, #f76b1c 100%)",
    "linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)",
    "linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    "linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)",
    "linear-gradient(135deg, #ffd89b 0%, #19547b 100%)",
    "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)",
  ],
  nature: [
    "linear-gradient(135deg, #d4fc79, #96e6a1)",
    "linear-gradient(135deg, #43e97b, #38f9d7)",
    "linear-gradient(135deg, #f9f047, #0fd850)",
    "linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)",
    "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    "linear-gradient(135deg, #0ba360 0%, #3cba92 100%)",
    "linear-gradient(135deg, #134e5e 0%, #71b280 100%)",
    "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)",
    "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)",
    "linear-gradient(135deg, #52c234 0%, #061700 100%)",
  ],
};

// Image categories with all images from bg.html
const IMAGE_CATEGORIES = {
  glass: [
    "https://shots.so/display-assets/backgrounds/paper-glass/preview/glass-1.jpg",
    "https://shots.so/display-assets/backgrounds/paper-glass/preview/glass-2.jpg",
    "https://shots.so/display-assets/backgrounds/paper-glass/preview/glass-3.jpg",
    "https://shots.so/display-assets/backgrounds/paper-glass/preview/glass-4.jpg",
    "https://shots.so/display-assets/backgrounds/paper-glass/preview/glass-5.jpg",
    "https://shots.so/display-assets/backgrounds/paper-glass/preview/glass-6.jpg",
    "https://shots.so/display-assets/backgrounds/paper-glass/preview/glass-7.jpg",
    "https://shots.so/display-assets/backgrounds/paper-glass/preview/glass-8.jpg",
    "https://shots.so/display-assets/backgrounds/paper-glass/preview/glass-9.jpg",
    "https://shots.so/display-assets/backgrounds/paper-glass/preview/glass-10.jpg",
    "https://shots.so/display-assets/backgrounds/paper-glass/preview/glass-11.jpg",
  ],
  cosmic: [
    "https://assets.shots.so/preview/cosmic/1.jpg",
    "https://assets.shots.so/preview/cosmic/2.jpg",
    "https://assets.shots.so/preview/cosmic/3.jpg",
    "https://assets.shots.so/preview/cosmic/4.jpg",
    "https://assets.shots.so/preview/cosmic/5.jpg",
    "https://assets.shots.so/preview/cosmic/6.jpg",
    "https://assets.shots.so/preview/cosmic/7.jpg",
    "https://assets.shots.so/preview/cosmic/8.jpg",
    "https://assets.shots.so/preview/cosmic/9.jpg",
    "https://assets.shots.so/preview/cosmic/10.jpg",
  ],
  mystic: [
    "https://assets.shots.so/mystic-gradients/preview/9.jpg",
    "https://assets.shots.so/mystic-gradients/preview/10.jpg",
    "https://assets.shots.so/mystic-gradients/preview/11.jpg",
    "https://assets.shots.so/mystic-gradients/preview/12.jpg",
    "https://assets.shots.so/mystic-gradients/preview/13.jpg",
    "https://assets.shots.so/mystic-gradients/preview/14.jpg",
    "https://assets.shots.so/mystic-gradients/preview/1.jpg",
    "https://assets.shots.so/mystic-gradients/preview/2.jpg",
    "https://assets.shots.so/mystic-gradients/preview/3.jpg",
    "https://assets.shots.so/mystic-gradients/preview/4.jpg",
    "https://assets.shots.so/mystic-gradients/preview/5.jpg",
    "https://assets.shots.so/mystic-gradients/preview/6.jpg",
    "https://assets.shots.so/mystic-gradients/preview/7.jpg",
    "https://assets.shots.so/mystic-gradients/preview/8.jpg",
    "https://assets.shots.so/mystic-gradients/preview/15.jpg",
  ],
  desktop: [
    "https://shots.so/display-assets/backgrounds/desktop/preview/tahoe-light.jpg",
    "https://shots.so/display-assets/backgrounds/desktop/preview/tahoe-dark.jpg",
    "https://shots.so/display-assets/backgrounds/desktop/preview/tahoe-landscape-day.jpg",
    "https://shots.so/display-assets/backgrounds/desktop/preview/tahoe-landscape-night.jpg",
    "https://assets.shots.so/preview/desktop/sequoia-light.jpeg",
    "https://assets.shots.so/preview/desktop/sonoma-light.jpg",
    "https://assets.shots.so/preview/desktop/ventura-light.jpg",
    "https://assets.shots.so/preview/desktop/sequoia-dark.jpeg",
    "https://assets.shots.so/preview/desktop/sonoma-dark.jpg",
    "https://assets.shots.so/preview/desktop/ventura-dark.jpg",
    "https://assets.shots.so/preview/desktop/monterey-light.jpg",
    "https://assets.shots.so/preview/desktop/bigsur-light.jpg",
    "https://assets.shots.so/preview/desktop/mojave-light.jpg",
    "https://assets.shots.so/preview/desktop/monterey-dark.jpg",
    "https://assets.shots.so/preview/desktop/bigsur-dark.jpg",
    "https://assets.shots.so/preview/desktop/mojave-dark.jpg",
    "https://assets.shots.so/preview/desktop/2.jpg",
    "https://assets.shots.so/preview/desktop/3.jpg",
    "https://assets.shots.so/preview/desktop/4.jpg",
    "https://assets.shots.so/preview/desktop/5.jpg",
    "https://assets.shots.so/preview/desktop/6.jpg",
    "https://assets.shots.so/preview/desktop/7.jpg",
    "https://assets.shots.so/preview/desktop/8.jpg",
    "https://assets.shots.so/preview/desktop/9.jpg",
    "https://assets.shots.so/preview/desktop/10.jpg",
    "https://assets.shots.so/preview/desktop/11.jpg",
    "https://assets.shots.so/preview/desktop/12.jpg",
    "https://assets.shots.so/preview/desktop/13.jpg",
    "https://assets.shots.so/preview/desktop/14.jpg",
    "https://assets.shots.so/preview/desktop/15.jpg",
    "https://assets.shots.so/preview/desktop/16.jpg",
    "https://assets.shots.so/preview/desktop/17.jpg",
    "https://assets.shots.so/preview/desktop/18.jpg",
    "https://assets.shots.so/preview/desktop/21.jpg",
    "https://assets.shots.so/preview/desktop/22.jpg",
    "https://assets.shots.so/preview/desktop/32.jpg",
  ],
  abstract: [
    "https://images.unsplash.com/photo-1687042277425-89b414406d3a?q=80&w=160&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1687042277586-971369d3d241?q=80&w=160&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1620121684840-edffcfc4b878?q=80&w=160&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1687392946855-8e35efa25ad7?q=80&w=160&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=160&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1655841439659-0afc60676b70?q=80&w=160&auto=format&fit=crop",
    "https://assets.shots.so/preview/abstract/1.jpg",
    "https://assets.shots.so/preview/abstract/16.jpg",
    "https://assets.shots.so/preview/abstract/12.jpg",
    "https://assets.shots.so/preview/abstract/2.jpg",
    "https://assets.shots.so/preview/abstract/19.jpg",
    "https://assets.shots.so/preview/abstract/18.jpg",
    "https://assets.shots.so/preview/abstract/3.jpg",
    "https://assets.shots.so/preview/abstract/4.jpg",
    "https://assets.shots.so/preview/abstract/5.jpg",
    "https://assets.shots.so/preview/abstract/6.jpg",
    "https://assets.shots.so/preview/abstract/7.jpg",
    "https://assets.shots.so/preview/abstract/8.jpg",
    "https://assets.shots.so/preview/abstract/9.jpg",
    "https://assets.shots.so/preview/abstract/10.jpg",
    "https://assets.shots.so/preview/abstract/11.jpg",
    "https://assets.shots.so/preview/abstract/13.jpg",
    "https://assets.shots.so/preview/abstract/14.jpg",
    "https://assets.shots.so/preview/abstract/15.jpg",
  ],
  earth: [
    "https://images.unsplash.com/photo-1482976818992-9487ee04f08b?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1554147090-e1221a04a025?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1499988921418-b7df40ff03f9?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1490358930084-2d26f21dc211?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1511860810434-a92f84c6f01e?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1554110397-9bac083977c6?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1508144753681-9986d4df99b3?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1671723521246-a6710cfafc70?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1674152318233-f4dfb61122f9?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1596742904532-ee155d0dac73?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1671180881490-8af6e9c3eaf1?auto=format&fit=crop&w=160&q=80",
    "https://assets.shots.so/preview/earth/1.jpg",
    "https://assets.shots.so/preview/earth/2.jpg",
    "https://assets.shots.so/preview/earth/3.jpg",
    "https://assets.shots.so/preview/earth/4.jpg",
    "https://assets.shots.so/preview/earth/5.jpg",
    "https://assets.shots.so/preview/earth/6.jpg",
    "https://assets.shots.so/preview/earth/7.jpg",
    "https://assets.shots.so/preview/earth/8.jpg",
    "https://assets.shots.so/preview/earth/9.jpg",
    "https://assets.shots.so/preview/earth/10.jpg",
  ],
  radiant: [
    "https://assets.shots.so/preview/radiant/1.jpg",
    "https://assets.shots.so/preview/radiant/2.jpg",
    "https://assets.shots.so/preview/radiant/3.jpg",
    "https://assets.shots.so/preview/radiant/4.jpg",
    "https://assets.shots.so/preview/radiant/5.jpg",
    "https://assets.shots.so/preview/radiant/6.jpg",
    "https://assets.shots.so/preview/radiant/7.jpg",
    "https://images.unsplash.com/photo-1604076984203-587c92ab2e58?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=160&q=80",
    "https://assets.shots.so/preview/radiant/8.jpg",
    "https://assets.shots.so/preview/radiant/9.jpg",
    "https://assets.shots.so/preview/radiant/10.jpg",
    "https://assets.shots.so/preview/radiant/11.jpg",
    "https://assets.shots.so/preview/radiant/12.jpg",
  ],
  texture: [
    "https://images.unsplash.com/photo-1495195129352-aeb325a55b65?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1531824475211-72594993ce2a?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1506968430777-bf7784a87f23?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1642455487913-1e21f9f6f5a0?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1639430257115-f63af9eab97d?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1571292098320-997aa03a5d19?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1529753253655-470be9a42781?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1506213463051-7694f7a4b9e7?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1575722290270-626b0208df99?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1550053808-52a75a05955d?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1507214617719-4a3daf41b9ac?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1531811027466-d90d527b4424?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1642675490569-b306a48b1515?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1610422218546-42b7f1f84dbd?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1597415884397-6c1213ee6d8e?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1642455512074-e99118a44e8a?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1537204319452-fdbd29e2ccc7?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1507692984170-ff22288b21cf?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1495578942200-c5f5d2137def?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1517196084897-498e0abd7c2d?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1486231328412-f20a348f9837?auto=format&fit=crop&w=160&q=80",
  ],
};

// Convert preview image URL to original image URL
function getOriginalImageUrl(previewUrl: string): string {
  // Handle Unsplash images - remove size constraints to get original
  if (previewUrl.includes("images.unsplash.com")) {
    try {
      const url = new URL(previewUrl);
      // Remove w, h, fit, and crop parameters to get original size
      url.searchParams.delete("w");
      url.searchParams.delete("h");
      url.searchParams.delete("fit");
      url.searchParams.delete("crop");
      // Keep quality and format if present
      return url.toString();
    } catch {
      return previewUrl;
    }
  }

  // Handle assets.shots.so preview URLs
  if (previewUrl.includes("assets.shots.so/preview")) {
    return previewUrl.replace("/preview/", "/original/");
  }

  // Handle shots.so display-assets preview URLs
  if (previewUrl.includes("shots.so/display-assets")) {
    return previewUrl.replace("/preview/", "/original/");
  }

  // If it's already an original URL or doesn't match patterns, return as-is
  return previewUrl;
}

// Detect background type from value
function detectBackgroundType(value: string): BackgroundType {
  if (value === "transparent") return "transparent";
  if (value.startsWith("url(")) return "image";
  if (value.startsWith("linear-gradient")) return "gradient";
  return "solid";
}

export function BackgroundSelector({
  backgroundColor,
  onBackgroundChange,
  onBackgroundTypeChange,
}: BackgroundSelectorProps) {
  const [backgroundType, setBackgroundType] = useState<BackgroundType>(() =>
    detectBackgroundType(backgroundColor)
  );
  const [customColor, setCustomColor] = useState(() => {
    const type = detectBackgroundType(backgroundColor);
    if (type === "solid" && backgroundColor.startsWith("#")) {
      return backgroundColor;
    }
    return "#0d0d0d";
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Sync backgroundType and customColor when backgroundColor prop changes
  useEffect(() => {
    const detectedType = detectBackgroundType(backgroundColor);
    setBackgroundType(detectedType);

    if (detectedType === "solid" && backgroundColor.startsWith("#")) {
      setCustomColor(backgroundColor);
    }
  }, [backgroundColor]);

  const handleTypeChange = (type: BackgroundType) => {
    setBackgroundType(type);
    onBackgroundTypeChange?.(type);

    switch (type) {
      case "transparent":
        onBackgroundChange("transparent");
        break;
      case "solid":
        onBackgroundChange(customColor);
        break;
      case "gradient":
        // Check if current background is not a gradient
        if (!backgroundColor.startsWith("linear-gradient")) {
          onBackgroundChange(
            GRADIENT_CATEGORIES.vibrant[0] ||
              Object.values(GRADIENT_CATEGORIES)[0][0]
          );
        }
        break;
      case "image":
        // Keep current if it's already an image
        if (!backgroundColor.startsWith("url(")) {
          const defaultPreviewUrl = IMAGE_CATEGORIES.glass[0];
          const defaultOriginalUrl = getOriginalImageUrl(defaultPreviewUrl);
          onBackgroundChange(`url(${defaultOriginalUrl})`);
        }
        break;
    }
  };

  const handleSolidColorSelect = (color: string) => {
    setCustomColor(color);
    onBackgroundChange(color);
  };

  const handleGradientSelect = (gradient: string) => {
    onBackgroundChange(gradient);
  };

  const handleImageSelect = (previewUrl: string) => {
    // Convert preview URL to original URL before setting
    const originalUrl = getOriginalImageUrl(previewUrl);
    onBackgroundChange(`url(${originalUrl})`);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <div className="space-y-5">
      {/* Type selector */}
      <div>
        <label
          className="block text-xs font-semibold uppercase mb-2 tracking-wider"
          style={{ color: "rgba(203, 213, 225, 0.5)" }}
        >
          BACKGROUND
        </label>
        <div
          className="grid grid-cols-4 gap-1 p-1 rounded-lg"
          style={{ background: "var(--color-bg-slider)" }}
        >
          {/* Transparent */}
          <button
            onClick={() => handleTypeChange("transparent")}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-md transition-all duration-200 cursor-pointer min-h-[60px] overflow-hidden ${
              backgroundType === "transparent"
                ? "bg-white/10"
                : "hover:bg-white/5"
            }`}
            style={{
              color:
                backgroundType === "transparent"
                  ? "rgba(240, 240, 240, 1)"
                  : "rgba(148, 163, 184, 0.5)",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                width="24"
                height="24"
                fill="url(#transparent_pattern)"
                fillOpacity="0.4"
                rx="6"
              />
              <rect
                width="23"
                height="23"
                x="0.5"
                y="0.5"
                stroke="currentColor"
                strokeOpacity="0.16"
                rx="5.5"
              />
              <defs>
                <pattern
                  id="transparent_pattern"
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="8" height="8" fill="#fff" />
                  <rect width="4" height="4" fill="#ddd" />
                </pattern>
              </defs>
            </svg>
            <span
              className="uppercase tracking-wider truncate w-full text-center px-1"
              style={{ fontSize: "9px", lineHeight: "1.2" }}
            >
              Transparent
            </span>
          </button>

          {/* Solid/Color */}
          <button
            onClick={() => handleTypeChange("solid")}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-md transition-all duration-200 cursor-pointer min-h-[60px] overflow-hidden ${
              backgroundType === "solid" ? "bg-white/10" : "hover:bg-white/5"
            }`}
            style={{
              color:
                backgroundType === "solid"
                  ? "rgba(240, 240, 240, 1)"
                  : "rgba(148, 163, 184, 0.5)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="currentColor"
            >
              <path d="m14.438 10.609-3.542 3.559c-.316.315-.719.425-1.051.073-.34-.377-.269-.724.088-1.088l3.513-3.565-.533-.536-6.364 6.403C4.198 17.823 5.279 17.51 4 19.326l.627.674c1.744-1.281 1.556-.072 3.946-2.466l6.392-6.398zm1.621 1.407.189-.211c.354-.382.378-.827-.01-1.215L16 10.351c1.163-1.051 2.484-1.223 3.283-2.042 1.132-1.147.769-2.759-.031-3.564-.794-.807-2.377-1.152-3.54-.031-.82.797-.984 2.135-2.028 3.306l-.235-.24c-.379-.385-.829-.364-1.209-.01l-.204.19c-.463.43-.367.833.018 1.223l2.79 2.81c.391.393.793.484 1.215.023" />
            </svg>
            <span
              className="uppercase tracking-wider truncate w-full text-center px-1"
              style={{ fontSize: "9px", lineHeight: "1.2" }}
            >
              Color
            </span>
          </button>

          {/* Gradient */}
          <button
            onClick={() => handleTypeChange("gradient")}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-md transition-all duration-200 cursor-pointer min-h-[60px] overflow-hidden ${
              backgroundType === "gradient" ? "bg-white/10" : "hover:bg-white/5"
            }`}
            style={{
              color:
                backgroundType === "gradient"
                  ? "rgba(240, 240, 240, 1)"
                  : "rgba(148, 163, 184, 0.5)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="currentColor"
            >
              <path d="M15.9 3C18.95 3 21 5.14 21 8.325v7.35C21 18.859 18.95 21 15.899 21h-7.8C5.049 21 3 18.859 3 15.675v-7.35C3 5.14 5.049 3 8.099 3zm.992 9.495c-.964-.602-1.709.243-1.91.513-.194.261-.36.549-.536.837-.429.711-.92 1.53-1.771 2.006-1.236.685-2.175.054-2.85-.405a5 5 0 0 0-.745-.44c-.604-.261-1.148.036-1.955 1.062-.424.536-.844 1.067-1.269 1.596-.255.317-.194.806.149 1.017.548.337 1.216.519 1.97.519h7.585c.428 0 .857-.059 1.266-.193a3.33 3.33 0 0 0 2.035-1.9c.322-.765.479-1.694.177-2.467-.1-.256-.25-.495-.461-.705-.553-.549-1.07-1.061-1.685-1.44M8.848 6.6a2.251 2.251 0 0 0 0 4.5c1.24 0 2.25-1.01 2.25-2.25 0-1.241-1.01-2.25-2.25-2.25" />
            </svg>
            <span
              className="uppercase tracking-wider truncate w-full text-center px-1"
              style={{ fontSize: "9px", lineHeight: "1.2" }}
            >
              Gradient
            </span>
          </button>

          {/* Image */}
          <button
            onClick={() => handleTypeChange("image")}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-md transition-all duration-200 cursor-pointer min-h-[60px] overflow-hidden ${
              backgroundType === "image" ? "bg-white/10" : "hover:bg-white/5"
            }`}
            style={{
              color:
                backgroundType === "image"
                  ? "rgba(240, 240, 240, 1)"
                  : "rgba(148, 163, 184, 0.5)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="currentColor"
            >
              <path d="M15.9 3C18.95 3 21 5.14 21 8.325v7.35C21 18.859 18.95 21 15.899 21h-7.8C5.049 21 3 18.859 3 15.675v-7.35C3 5.14 5.049 3 8.099 3zm.992 9.495c-.964-.602-1.709.243-1.91.513-.194.261-.36.549-.536.837-.429.711-.92 1.53-1.771 2.006-1.236.685-2.175.054-2.85-.405a5 5 0 0 0-.745-.44c-.604-.261-1.148.036-1.955 1.062-.424.536-.844 1.067-1.269 1.596-.255.317-.194.806.149 1.017.548.337 1.216.519 1.97.519h7.585c.428 0 .857-.059 1.266-.193a3.33 3.33 0 0 0 2.035-1.9c.322-.765.479-1.694.177-2.467-.1-.256-.25-.495-.461-.705-.553-.549-1.07-1.061-1.685-1.44M8.848 6.6a2.251 2.251 0 0 0 0 4.5c1.24 0 2.25-1.01 2.25-2.25 0-1.241-1.01-2.25-2.25-2.25" />
            </svg>
            <span
              className="uppercase tracking-wider truncate w-full text-center px-1"
              style={{ fontSize: "9px", lineHeight: "1.2" }}
            >
              Image
            </span>
          </button>
        </div>
      </div>

      {/* Content based on type */}
      {/* Transparent shows nothing in sidebar (as requested) */}

      {backgroundType === "solid" && (
        <div className="space-y-4">
          {/* Color picker */}
          <div>
            <label
              className="block text-xs font-medium mb-2"
              style={{ color: "rgba(203, 213, 225, 0.75)" }}
            >
              Custom Color
            </label>
            <input
              type="color"
              value={customColor}
              onChange={(e) => handleSolidColorSelect(e.target.value)}
              className="w-full h-10 rounded-md cursor-pointer transition-all duration-200"
              style={{
                background: "var(--color-bg-slider)",
                border: "1px solid rgba(148, 163, 184, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.1)";
              }}
            />
          </div>

          {/* Solid colors grid */}
          <div>
            <label
              className="block text-xs font-medium mb-2"
              style={{ color: "rgba(203, 213, 225, 0.75)" }}
            >
              Presets
            </label>
            <div className="grid grid-cols-4 gap-1">
              {SOLID_COLORS.map((color, index) => {
                const isSelected = backgroundColor === color;
                return (
                  <button
                    key={index}
                    onClick={() => handleSolidColorSelect(color)}
                    className={`aspect-square rounded-md transition-all duration-200 ${
                      isSelected ? "ring-2 scale-105" : "hover:scale-105"
                    }`}
                    style={{
                      background: color,
                      ...(isSelected &&
                        ({
                          "--tw-ring-color": "rgba(255, 255, 255, 0.5)",
                          "--tw-ring-width": "2px",
                        } as React.CSSProperties)),
                    }}
                    title={color}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {backgroundType === "gradient" && (
        <div className="space-y-4">
          {Object.entries(GRADIENT_CATEGORIES).map(([category, gradients]) => {
            const isExpanded = expandedCategories.has(category);
            const hasMore = gradients.length > 3;
            const firstThreeGradients = gradients.slice(0, 3);
            const remainingGradients = gradients.slice(3);

            return (
              <div key={category} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="block text-xs font-medium capitalize"
                    style={{ color: "rgba(203, 213, 225, 0.75)" }}
                  >
                    {category}
                  </label>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {/* First 3 gradients - always visible */}
                  {firstThreeGradients.map((gradient, index) => {
                    const isSelected = backgroundColor === gradient;
                    return (
                      <button
                        key={index}
                        onClick={() => handleGradientSelect(gradient)}
                        className={`aspect-square rounded-md transition-all duration-200 ${
                          isSelected ? "ring-2" : "hover:scale-105"
                        }`}
                        style={{
                          background: gradient,
                          ...(isSelected &&
                            ({
                              "--tw-ring-color": "rgba(255, 255, 255, 0.5)",
                              "--tw-ring-width": "2px",
                            } as React.CSSProperties)),
                        }}
                      />
                    );
                  })}
                  {/* Expand button - always at 4th position */}
                  {hasMore && (
                    <button
                      onClick={() => toggleCategory(category)}
                      className="aspect-square rounded-md transition-all duration-200 bg-black/5 border-2 border-white/10 flex items-center justify-center hover:scale-105 cursor-pointer"
                      title={
                        isExpanded
                          ? "Show less"
                          : `+${gradients.length - 3} more`
                      }
                    >
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        style={{ color: "rgba(255, 255, 255, 0.8)" }}
                      />
                    </button>
                  )}
                  {/* Remaining gradients - only visible when expanded */}
                  {isExpanded &&
                    remainingGradients.map((gradient, index) => {
                      const isSelected = backgroundColor === gradient;
                      return (
                        <button
                          key={index + 3}
                          onClick={() => handleGradientSelect(gradient)}
                          className={`aspect-square rounded-md transition-all duration-200 ${
                            isSelected ? "ring-2 scale-105" : "hover:scale-105"
                          }`}
                          style={{
                            background: gradient,
                            ...(isSelected &&
                              ({
                                "--tw-ring-color": "rgba(255, 255, 255, 0.5)",
                                "--tw-ring-width": "2px",
                              } as React.CSSProperties)),
                          }}
                        />
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {backgroundType === "image" && (
        <div className="space-y-4">
          {Object.entries(IMAGE_CATEGORIES).map(([category, images]) => {
            const isExpanded = expandedCategories.has(category);
            const hasMore = images.length > 3;
            const firstThreeImages = images.slice(0, 3);
            const remainingImages = images.slice(3);

            return (
              <div key={category} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="block text-xs font-medium capitalize"
                    style={{ color: "rgba(203, 213, 225, 0.75)" }}
                  >
                    {category}
                  </label>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {/* First 3 images - always visible */}
                  {firstThreeImages.map((previewUrl, index) => {
                    const originalUrl = getOriginalImageUrl(previewUrl);
                    // Check both original and preview URLs for backwards compatibility
                    const isSelected =
                      backgroundColor === `url(${originalUrl})` ||
                      backgroundColor === `url(${previewUrl})`;
                    return (
                      <button
                        key={index}
                        onClick={() => handleImageSelect(previewUrl)}
                        className={`aspect-square rounded-md transition-all duration-200 bg-cover bg-center ${
                          isSelected ? "ring-2" : "hover:scale-105"
                        }`}
                        style={{
                          backgroundImage: `url(${previewUrl})`,
                          ...(isSelected &&
                            ({
                              "--tw-ring-color": "rgba(255, 255, 255, 0.5)",
                              "--tw-ring-width": "2px",
                            } as React.CSSProperties)),
                        }}
                      />
                    );
                  })}
                  {/* Expand button - always at 4th position */}
                  {hasMore && (
                    <button
                      onClick={() => toggleCategory(category)}
                      className="aspect-square rounded-md transition-all duration-200 bg-black/5 border-2 border-white/10 flex items-center justify-center hover:scale-105 cursor-pointer"
                      title={
                        isExpanded ? "Show less" : `+${images.length - 3} more`
                      }
                    >
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        style={{ color: "rgba(255, 255, 255, 0.8)" }}
                      />
                    </button>
                  )}
                  {/* Remaining images - only visible when expanded */}
                  {isExpanded &&
                    remainingImages.map((previewUrl, index) => {
                      const originalUrl = getOriginalImageUrl(previewUrl);
                      // Check both original and preview URLs for backwards compatibility
                      const isSelected =
                        backgroundColor === `url(${originalUrl})` ||
                        backgroundColor === `url(${previewUrl})`;
                      return (
                        <button
                          key={index + 3}
                          onClick={() => handleImageSelect(previewUrl)}
                          className={`aspect-square rounded-md transition-all duration-200 bg-cover bg-center ${
                            isSelected ? "ring-2 scale-105" : "hover:scale-105"
                          }`}
                          style={{
                            backgroundImage: `url(${previewUrl})`,
                            ...(isSelected &&
                              ({
                                "--tw-ring-color": "rgba(255, 255, 255, 0.5)",
                                "--tw-ring-width": "2px",
                              } as React.CSSProperties)),
                          }}
                        />
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
