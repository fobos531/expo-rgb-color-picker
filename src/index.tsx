import React, { useState, useEffect, useRef, RefObject } from "react";
import { Animated, Button, Text, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  PanGestureHandler,
  TapGestureHandler,
} from "react-native-gesture-handler";

interface Props {
  containerStyle?: ViewStyle;
  previewStyle?: ViewStyle;
  barStyle?: ViewStyle;
  ballStyle?: ViewStyle;
  initialBaseSlider?: number;
  initialBase?: [number, number, number];
  onBaseSlider?: (slide: number) => void;
  onBase?: (base: [number, number, number]) => void;
  initialColorSlider?: number;
  initialColor?: [number, number, number];
  onColorSlider?: (slide: number) => void;
  onColor?: (color: [number, number, number]) => void;
}

const SELECTION_RADIUS = 18;

const COLORS: [number, number, number][] = [
  [255, 0, 0],
  [255, 0, 255],
  [0, 0, 255],
  [0, 255, 255],
  [0, 255, 0],
  [255, 255, 0],
  [255, 0, 0],
];

function mapColorNumToString(nums: [number, number, number]): string {
  return `rgb(${nums[0].toString()},${nums[1].toString()},${nums[2].toString()})`;
}

function calcLinear(scale: number, first: number, second: number): number {
  return first + scale * (second - first);
}

function getColor(
  x: number,
  colors: [number, number, number][]
): [number, number, number] {
  const indicesToVal = colors.map((_, index) => index / (colors.length - 1));
  let upperIx = 0;
  while (upperIx < indicesToVal.length && x > indicesToVal[upperIx])
    upperIx += 1;
  if (upperIx <= 0) return colors[0];
  if (upperIx >= indicesToVal.length) upperIx = indicesToVal.length - 1;
  const lowerIx = upperIx - 1;

  const lowerColor = colors[lowerIx];
  const upperColor = colors[upperIx];
  const betweenScale =
    (x - indicesToVal[lowerIx]) /
    (indicesToVal[upperIx] - indicesToVal[lowerIx]);

  const newColor: [number, number, number] = [
    calcLinear(betweenScale, lowerColor[0], upperColor[0]),
    calcLinear(betweenScale, lowerColor[1], upperColor[1]),
    calcLinear(betweenScale, lowerColor[2], upperColor[2]),
  ];

  return newColor;
}

const RgbColorPicker: React.FC<Props> = ({
  containerStyle,
  barStyle,
  previewStyle,
  ballStyle,
  initialBaseSlider,
  initialBase,
  onBaseSlider,
  onBase,
  initialColorSlider,
  initialColor,
  onColorSlider,
  onColor,
}: Props) => {
  const [width, setWidth] = useState(
    typeof containerStyle?.width === "number"
      ? (containerStyle.width as number)
      : 0
  );
  const [height, setHeight] = useState(
    typeof containerStyle?.height === "number"
      ? (containerStyle.height as number)
      : 0
  );

  const panBaseRef = useRef<PanGestureHandler>();
  const tapBaseRef = useRef<TapGestureHandler>();
  const panColorRef = useRef<PanGestureHandler>();
  const tapColorRef = useRef<TapGestureHandler>();

  const selectedBase = useRef(
    new Animated.Value(initialBaseSlider ? initialBaseSlider * width : 0)
  ).current;
  const [base, setBase] = useState<[number, number, number]>(
    initialBase || [255, 0, 0]
  );

  const selectedColor = useRef(new Animated.Value(0)).current;
  const [colorSlide, setColorSlide] = useState(
    initialColorSlider ? initialColorSlider * width : 0
  );
  const [color, setColor] = useState<[number, number, number]>(
    initialColor || [0, 0, 0]
  );

  useEffect(() => {
    selectedBase.addListener(({ value }) => {
      const newBaseSlide = value / width;

      if (onBaseSlider) onBaseSlider(newBaseSlide);
      const newBase = getColor(newBaseSlide, COLORS);
      if (onBase) onBase(newBase);
      setBase(newBase);
      const newColor = getColor(colorSlide, [
        [0, 0, 0],
        newBase,
        [255, 255, 255],
      ]);
      if (onColor) onColor(newColor);
      setColor(newColor);
    });

    selectedColor.addListener(({ value }) => {
      const newColorSlide = value / width;
      if (onColorSlider) onColorSlider(newColorSlide);
      setColorSlide(newColorSlide);
      const newColor = getColor(newColorSlide, [
        [0, 0, 0],
        base,
        [255, 255, 255],
      ]);
      if (onColor) onColor(newColor);
      setColor(newColor);
    });

    return () => {
      selectedBase.removeAllListeners();
      selectedColor.removeAllListeners();
    };
  }, [base, width]);

  useEffect(() => {
 
  }, []);

  const setWithinBounds = (val: Animated.Value, { x }: { x: number }) => {
    val.setValue(Math.max(Math.min(x, width), 0));
  };

  return (
    <View style={containerStyle}>
      <View
        style={[
          previewStyle,
          {
            backgroundColor: mapColorNumToString(color),
          },
        ]}
      />
      <PanGestureHandler
        ref={panBaseRef as RefObject<PanGestureHandler>}
        onGestureEvent={(e) => {
          setWithinBounds(selectedBase, e.nativeEvent);
        }}
        simultaneousHandlers={[tapBaseRef]}
      >
        <TapGestureHandler
          ref={tapBaseRef as RefObject<TapGestureHandler>}
          onHandlerStateChange={(e) => {
            setWithinBounds(selectedBase, e.nativeEvent);
          }}
          simultaneousHandlers={[panBaseRef]}
        >
          <View
            style={barStyle}
            onLayout={(e) => {
              setWidth(e.nativeEvent.layout.width);
              setHeight(e.nativeEvent.layout.height);
            }}
          >
            <LinearGradient
              start={{ x: 0, y: 0.5 }}
              locations={COLORS.map((_, index) => index / (COLORS.length - 1))}
              end={{ x: 1, y: 0.5 }}
              colors={COLORS.map((colorNum) => mapColorNumToString(colorNum))}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 8,
              }}
            />
            <Animated.View
              style={[
                ballStyle,
                {
                  borderColor: "black",
                  backgroundColor: mapColorNumToString(base),
                },
                {
                  transform: [
                    { translateX: selectedBase },
                    { translateX: -SELECTION_RADIUS },
                    { translateY: height / 2 - SELECTION_RADIUS },
                  ],
                },
              ]}
            />
          </View>
        </TapGestureHandler>
      </PanGestureHandler>
      <PanGestureHandler
        ref={panColorRef as RefObject<PanGestureHandler>}
        onGestureEvent={(e) => {
          setWithinBounds(selectedColor, e.nativeEvent);
        }}
        simultaneousHandlers={[tapColorRef]}
      >
        <TapGestureHandler
          ref={tapColorRef as RefObject<TapGestureHandler>}
          onHandlerStateChange={(e) => {
            setWithinBounds(selectedColor, e.nativeEvent);
          }}
          simultaneousHandlers={[panColorRef]}
        >
          <View style={barStyle}>
            <LinearGradient
              start={{ x: 0, y: 0.5 }}
              locations={[0, 0.5, 1]}
              end={{ x: 1, y: 0.5 }}
              colors={[
                "rgb(0,0,0)",
                mapColorNumToString(base),
                "rgb(255,255,255)",
              ]}
              style={{ width: "100%", height: "100%", borderRadius: 8 }}
            />
            <Animated.View
              style={[
                ballStyle,
                {
                  borderColor: selectedColor.interpolate({
                    inputRange: [0, width],
                    outputRange: ["#FFF", "#000"],
                  }),
                  backgroundColor: mapColorNumToString(color),
                },
                {
                  transform: [
                    { translateX: selectedColor },
                    { translateX: -SELECTION_RADIUS },
                    { translateY: height / 2 - SELECTION_RADIUS },
                  ],
                },
              ]}
            />
          </View>
        </TapGestureHandler>
      </PanGestureHandler>
    </View>
  );
};

RgbColorPicker.defaultProps = {
  containerStyle: {
    justifyContent: "center",
    alignItems: "center",
    width: 300,
  },
  previewStyle: {
    width: 80,
    height: 80,
    borderRadius: 50,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: "black",
  },
  barStyle: {
    width: "100%",
    height: 32,
    marginVertical: 8,
  },
  ballStyle: {
    width: SELECTION_RADIUS * 2,
    height: SELECTION_RADIUS * 2,
    borderRadius: SELECTION_RADIUS,
    backgroundColor: "black",
    position: "absolute",
    borderWidth: 2,
    borderColor: "white",
  },
};

export { RgbColorPicker };
