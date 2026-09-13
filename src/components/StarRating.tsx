import styles from "./StarRating.module.css";

interface StarRatingProps {
  stars: 0 | 1 | 2 | 3;
  size?: "small" | "medium" | "large";
}

export function StarRating({ stars, size = "medium" }: StarRatingProps) {
  return (
    <div
      className={[styles.wrapper, styles[size]].join(" ")}
      role="img"
      aria-label={`${stars} из 3 звёзд`}
    >
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= stars ? styles.filled : styles.empty} aria-hidden="true">
          ★
        </span>
      ))}
    </div>
  );
}
