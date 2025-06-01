import { g as baseService, h as isESMImportedImage } from './astro/assets-service_d1YwEJAr.mjs';
import './_astro_assets_BTZXm36s.mjs';
import 'deterministic-object-hash';
import sharp from 'sharp';
import { optimize } from 'svgo';

const parseQuality = (quality) => {
  const result = Number.parseInt(quality);
  if (Number.isNaN(result)) {
    return quality;
  }
  return result;
};
const qualityTable = {
  low: 25,
  mid: 50,
  high: 80,
  max: 100
};

const sharpOptions = {
  png: {
    compressionLevel: 9,
    palette: true,
    effort: 10
  },
  jpeg: {
    // cspell:ignore mozjpeg
    mozjpeg: true
  },
  webp: {
    effort: 6
  },
  avif: {
    // cspell:ignore subsampling
    chromaSubsampling: "4:2:0",
    effort: 9
  }
};
const svgoOptions = {
  // cspell:ignore multipass
  multipass: true,
  js2svg: {
    indent: 0,
    pretty: false
  },
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          // viewBox is important for some use cases
          // ref: https://github.com/svg/svgo/issues/1128
          removeViewBox: false
        }
      }
    }
  ]
};

const service = {
  // biome-ignore lint/style/useNamingConvention: following the Astro API
  //getURL: baseService.getURL,
  getURL(options, imageConfig) {
    const searchParams = new URLSearchParams();
    searchParams.append(
      "href",
      typeof options.src === "string" ? options.src : options.src.src
    );
    options.width && searchParams.append("w", options.width.toString().trim());
    options.height && searchParams.append("h", options.height.toString().trim());
    options.quality && searchParams.append("q", options.quality.toString().trim());
    options.format && searchParams.append("f", options.format.trim());
    options.aspect && searchParams.append("ar", options.aspect.toString().trim());
    options.position && searchParams.append("pos", options.position.toString().trim());
    return `/_image?${searchParams}`;
  },
  parseURL(url, imageConfig) {
    const params = new URLSearchParams(url.search);
    const settings = {
      src: params.get("href"),
      width: params.has("w") ? parseInt(params.get("w")) : void 0,
      height: params.has("h") ? parseInt(params.get("h")) : void 0,
      format: params.get("f"),
      quality: params.get("q"),
      aspect: params.get("ar"),
      position: params.get("pos")
    };
    return settings;
  },
  getHTMLAttributes: baseService.getHTMLAttributes,
  getSrcSet: baseService.getSrcSet,
  async validateOptions(options, imageConfig) {
    const targetFormat = options.format;
    const result = await baseService.validateOptions(options, imageConfig);
    if (isESMImportedImage(options.src) && options.src.format === "svg" && targetFormat) {
      result.format = targetFormat;
    }
    return result;
  },
  // based on sharp image service
  // https://github.com/withastro/astro/blob/8d5ea2df5d52ad9a311c407533b9f4226480faa8/packages/astro/src/assets/services/sharp.ts#L44-L89
  async transform(inputBuffer, options, config) {
    let { width, height, format, quality, aspect, position } = options;
    height = aspect ? Math.round(width / aspect) : height;
    aspect = aspect || width / height;
    if (format === "svg") {
      const svgString = new TextDecoder().decode(inputBuffer);
      const result2 = optimize(svgString, svgoOptions);
      return {
        data: new TextEncoder().encode(result2.data),
        format: "svg"
      };
    }
    const svgText = `
  <svg  viewBox="0 0 200 80" >
    <style>
      .img-title { fill: red; font-size: 40px; } 
    </style> 
    <text x="45%" y="40%" text-anchor="middle" class="img-title">${width}</text>
    
  </svg>`;
    Buffer.from(svgText);
    const result = sharp(inputBuffer, {
      failOnError: false,
      pages: -1,
      limitInputPixels: config.service.config["limitInputPixels"]
    });
    result.rotate();
    if (height && !width) {
      result.resize({ height: Math.round(height) });
    } else if (width && !height) {
      result.resize({ width: Math.round(width) });
    } else if (width && height) {
      result.resize({
        width: Math.round(width),
        height: Math.round(height),
        fit: sharp.fit.cover,
        position: position ? sharp.strategy[position] : sharp.strategy.entropy
      });
    }
    let sharpQuality;
    if (quality) {
      const parsedQuality = parseQuality(quality);
      if (typeof parsedQuality === "number") {
        sharpQuality = parsedQuality;
      } else {
        sharpQuality = quality in qualityTable ? qualityTable[quality] : void 0;
      }
    }
    result.toFormat(format, {
      quality: sharpQuality,
      ...sharpOptions[format === "jpg" ? "jpeg" : format]
    });
    const { data, info } = await result.toBuffer({ resolveWithObject: true });
    return {
      data,
      format: info.format
    };
  }
};

export { service as default };
