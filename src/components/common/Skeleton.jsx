/**
 * @component Skeleton
 * @description Animated skeleton loader for better perceived performance.
 *              Uses Ant Design Skeleton as base with Tailwind styling.
 *
 * Usage:
 *   <Skeleton />
 *   <Skeleton active paragraph={{ rows: 4 }} />
 *   <Skeleton avatar active />
 *   <Skeleton.Button active size="large" block />
 *   <Skeleton.Input active size="large" />
 *   <Skeleton.Avatar active size="large" shape="circle" />
 */

import React from 'react';
import { Skeleton as AntSkeleton } from 'antd';
import styles from './Skeleton.module.css';

/**
 * Skeleton component wrapper with custom styling
 */
const Skeleton = ({
  className,
  ...props
}) => {
  return (
    <AntSkeleton
      className={`${styles.skeleton} ${className || ''}`}
      {...props}
    />
  );
};

/**
 * Skeleton line (for text, titles, descriptions)
 */
Skeleton.Line = AntSkeleton;

/**
 * Skeleton button
 */
Skeleton.Button = AntSkeleton.Button;

/**
 * Skeleton input
 */
Skeleton.Input = AntSkeleton.Input;

/**
 * Skeleton avatar
 */
Skeleton.Avatar = AntSkeleton.Avatar;

export default Skeleton;
