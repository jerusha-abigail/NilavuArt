"""Classic computer-vision heuristics that turn a drawing/painting into
objective, explainable feedback -- no external AI API required.

Each metric is scored 0-100. The overall score is a weighted average.
This module is intentionally simple and well-commented so a beginner
(e.g. a high schooler following along with the CV can read every line.
"""
from __future__ import annotations

import numpy as np
import cv2


def _score_from_ideal(value: float, ideal_low: float, ideal_high: float, spread: float) -> float:
    """Map a raw value to a 0-100 score, peaking inside [ideal_low, ideal_high]."""
    if ideal_low <= value <= ideal_high:
        return 100.0
    distance = ideal_low - value if value < ideal_low else value - ideal_high
    penalty = min(100.0, (distance / spread) * 100.0)
    return max(0.0, 100.0 - penalty)


def analyze_brightness(gray: np.ndarray) -> tuple[float, str]:
    mean_brightness = float(np.mean(gray))  # 0-255
    score = _score_from_ideal(mean_brightness, 90, 190, 90)
    if mean_brightness < 90:
        tip = "The piece reads quite dark overall. Try adding a few brighter highlights."
    elif mean_brightness > 190:
        tip = "The piece is very bright/washed out. Add some darker shadows for depth."
    else:
        tip = "Brightness is well balanced."
    return score, tip


def analyze_contrast(gray: np.ndarray) -> tuple[float, str]:
    std_dev = float(np.std(gray))  # spread of tones
    score = _score_from_ideal(std_dev, 45, 80, 45)
    if std_dev < 45:
        tip = "Contrast is low -- try pushing your darkest darks and lightest lights further apart."
    else:
        tip = "Good tonal contrast between light and dark areas."
    return score, tip


def analyze_color_balance(bgr: np.ndarray) -> tuple[float, str]:
    b, g, r = cv2.split(bgr.astype(np.float32))
    means = np.array([b.mean(), g.mean(), r.mean()])
    max_diff = float(np.max(means) - np.min(means))
    score = _score_from_ideal(max_diff, 0, 35, 60)
    dominant = ["blue", "green", "red"][int(np.argmax(means))]
    if max_diff > 35:
        tip = f"There's a strong {dominant} color cast -- consider balancing it with complementary colors."
    else:
        tip = "Color channels are well balanced across the image."
    return score, tip


def analyze_saturation(bgr: np.ndarray) -> tuple[float, str]:
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    mean_sat = float(np.mean(hsv[:, :, 1]))  # 0-255
    score = _score_from_ideal(mean_sat, 60, 170, 80)
    if mean_sat < 60:
        tip = "Colors look a bit muted/desaturated -- experiment with bolder color choices."
    elif mean_sat > 170:
        tip = "Colors are very saturated -- muted tones could add contrast and realism."
    else:
        tip = "Saturation levels feel natural and pleasing."
    return score, tip


def analyze_line_quality(gray: np.ndarray) -> tuple[float, str]:
    edges = cv2.Canny(gray, 50, 150)
    edge_density = float(np.mean(edges > 0))  # fraction of pixels that are edges
    score = _score_from_ideal(edge_density * 100, 2, 15, 12)
    if edge_density * 100 < 2:
        tip = "Line/edge detail is sparse -- adding more defined linework could strengthen the piece."
    elif edge_density * 100 > 15:
        tip = "There's a lot of busy detail/noise -- simplifying some areas may help focus the eye."
    else:
        tip = "Line work and detail density look balanced."
    return score, tip


def analyze_composition(gray: np.ndarray) -> tuple[float, str]:
    """Rough rule-of-thirds check: is visual 'weight' near the third-lines?"""
    h, w = gray.shape
    edges = cv2.Canny(gray, 50, 150)
    ys, xs = np.nonzero(edges)
    if len(xs) == 0:
        return 50.0, "Not enough visual detail detected to evaluate composition."

    thirds_x = [w / 3, 2 * w / 3]
    thirds_y = [h / 3, 2 * h / 3]
    tol_x, tol_y = w * 0.08, h * 0.08

    near_third = np.zeros(len(xs), dtype=bool)
    for tx in thirds_x:
        near_third |= np.abs(xs - tx) < tol_x
    for ty in thirds_y:
        near_third |= np.abs(ys - ty) < tol_y

    fraction_near = float(np.mean(near_third))
    score = _score_from_ideal(fraction_near * 100, 25, 100, 40)
    if fraction_near < 0.25:
        tip = "Key elements are clustered near the center -- try the rule of thirds to add visual interest."
    else:
        tip = "Composition uses off-center placement effectively (rule of thirds)."
    return score, tip


WEIGHTS = {
    "brightness": 0.15,
    "contrast": 0.20,
    "color_balance": 0.15,
    "saturation": 0.15,
    "line_quality": 0.15,
    "composition": 0.20,
}


def analyze_artwork(image_bytes: bytes) -> dict:
    """Run all CV heuristics on an uploaded image and return a feedback dict."""
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    if arr.size == 0:
        raise ValueError("The uploaded image is empty.")
    bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if bgr is None:
        raise ValueError("Could not decode image -- please upload a valid JPG/PNG file.")

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    brightness_score, brightness_tip = analyze_brightness(gray)
    contrast_score, contrast_tip = analyze_contrast(gray)
    color_score, color_tip = analyze_color_balance(bgr)
    saturation_score, saturation_tip = analyze_saturation(bgr)
    line_score, line_tip = analyze_line_quality(gray)
    composition_score, composition_tip = analyze_composition(gray)

    scores = {
        "brightness": brightness_score,
        "contrast": contrast_score,
        "color_balance": color_score,
        "saturation": saturation_score,
        "line_quality": line_score,
        "composition": composition_score,
    }
    overall = sum(scores[k] * WEIGHTS[k] for k in WEIGHTS)

    tips = {
        "brightness": brightness_tip,
        "contrast": contrast_tip,
        "color_balance": color_tip,
        "saturation": saturation_tip,
        "line_quality": line_tip,
        "composition": composition_tip,
    }
    # Surface suggestions only for the weaker-scoring metrics.
    weak_metrics = sorted(scores, key=scores.get)[:3]
    suggestions = [tips[m] for m in weak_metrics if scores[m] < 85]
    if not suggestions:
        suggestions = ["Great work overall -- keep practicing to build on these strengths!"]

    if overall >= 85:
        summary = "Excellent piece! Strong fundamentals across the board."
    elif overall >= 65:
        summary = "Solid piece with a few areas to improve."
    else:
        summary = "Good starting point -- focus on the suggestions below to level up."

    return {
        "overall_score": round(overall, 1),
        "scores": {k: round(v, 1) for k, v in scores.items()},
        "summary": summary,
        "suggestions": suggestions,
        "weak_tags": weak_metrics,
    }
