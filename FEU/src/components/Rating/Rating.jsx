import React, { useMemo } from "react";
import SvgStarIcon from "../commom/SvgStarIcon";
import { SvgEmptyStar } from "../commom/SvgEmptyStar";

const Rating = ({ rating }) => {
  const ratingNumber = useMemo(() => {
    const validRating = Number(rating) || 0;
    const clampedRating = Math.max(0, Math.min(5, validRating));
    return Array(Math.floor(clampedRating)).fill();
  }, [rating]);

  const emptyStars = useMemo(() => {
    return Math.max(0, 5 - ratingNumber.length);
  }, [ratingNumber]);

  return (
    <div className="flex items-center">
      {ratingNumber?.map((_, index) => (
        <SvgStarIcon key={index} />
      ))}
      {Array(emptyStars)
        .fill()
        .map((_, index) => (
          <SvgEmptyStar key={"empty-" + index} />
        ))}
      <p className="px-2 text-gray-500">{rating || 0}</p>
    </div>
  );
};

export default Rating;
