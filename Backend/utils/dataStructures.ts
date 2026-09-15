/**
 * Urbanico Core Data Structures & Algorithms
 * 
 * Clean, well-documented implementations for caching, queuing, and searching.
 * Designed so developers and beginners can understand fundamental CS concepts
 * used in production environments.
 */

// ============================================================================
// 1. DATA STRUCTURE: LRUCache (Least Recently Used Cache)
// ============================================================================
/**
 * LRUCache stores key-value pairs up to a maximum capacity.
 * When full, it automatically evicts the least recently used item.
 * 
 * Time Complexity:
 * - get: O(1)
 * - set: O(1)
 * - has: O(1)
 * 
 * Uses JavaScript's built-in Map, which maintains insertion order.
 * Whenever an item is accessed or updated, it is moved to the end.
 */
export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number = 100) {
    if (capacity <= 0) {
      throw new Error('LRUCache capacity must be greater than 0');
    }
    this.capacity = capacity;
    this.cache = new Map<K, V>();
  }

  /**
   * Retrieves an item and marks it as most recently used.
   */
  public get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    const value = this.cache.get(key)!;
    // Re-insert to move it to the end (most recent)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Inserts or updates an item. If capacity is exceeded, evicts the oldest item.
   */
  public set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // The first entry in the Map iterator is the least recently used
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  public has(key: K): boolean {
    return this.cache.has(key);
  }

  public delete(key: K): boolean {
    return this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public get size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// 2. DATA STRUCTURE: Queue (First-In, First-Out)
// ============================================================================
/**
 * Standard FIFO Queue for dispatching jobs, telemetry coordinates, and notifications.
 * 
 * Time Complexity:
 * - enqueue: O(1)
 * - dequeue: O(1) amortized
 * - peek: O(1)
 */
export class Queue<T> {
  private items: T[] = [];
  private headIndex: number = 0;

  public enqueue(item: T): void {
    this.items.push(item);
  }

  public dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;

    const item = this.items[this.headIndex];
    this.headIndex++;

    // Reset array to prevent unbounded memory growth when headIndex gets large
    if (this.headIndex > 100 && this.headIndex * 2 >= this.items.length) {
      this.items = this.items.slice(this.headIndex);
      this.headIndex = 0;
    }

    return item;
  }

  public peek(): T | undefined {
    if (this.isEmpty()) return undefined;
    return this.items[this.headIndex];
  }

  public isEmpty(): boolean {
    return this.headIndex >= this.items.length;
  }

  public get size(): number {
    return Math.max(0, this.items.length - this.headIndex);
  }

  public clear(): void {
    this.items = [];
    this.headIndex = 0;
  }

  public toArray(): T[] {
    return this.items.slice(this.headIndex);
  }
}

// ============================================================================
// 3. ALGORITHMS: Binary Search & Paginate/Sort
// ============================================================================

/**
 * Binary Search Algorithm
 * Finds the index of a target in a sorted array in O(log n) time.
 * 
 * @param sortedArray An array sorted in ascending order
 * @param target The item to find
 * @param comparator Comparison function: returns <0 if a < b, 0 if a === b, >0 if a > b
 */
export function binarySearch<T>(
  sortedArray: T[],
  target: T,
  comparator: (a: T, b: T) => number = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
): number {
  let low = 0;
  let high = sortedArray.length - 1;

  while (low <= high) {
    // Avoid integer overflow
    const mid = Math.floor(low + (high - low) / 2);
    const comparison = comparator(sortedArray[mid], target);

    if (comparison === 0) {
      return mid; // Target found at index mid
    } else if (comparison < 0) {
      low = mid + 1; // Look in right half
    } else {
      high = mid - 1; // Look in left half
    }
  }

  return -1; // Not found
}

export interface PaginationOptions<T> {
  page?: number;
  limit?: number;
  sortField?: keyof T;
  sortDirection?: 'asc' | 'desc';
  filterPredicate?: (item: T) => boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

/**
 * Universal pagination, filtering, and sorting algorithm.
 * Replaces duplicate pagination logic across endpoints and tables.
 */
export function paginateAndSort<T>(
  collection: T[],
  options: PaginationOptions<T> = {}
): PaginatedResult<T> {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));

  // 1. Filter
  let filtered = options.filterPredicate
    ? collection.filter(options.filterPredicate)
    : collection;

  // 2. Sort
  if (options.sortField) {
    const field = options.sortField;
    const direction = options.sortDirection === 'desc' ? -1 : 1;

    filtered = [...filtered].sort((a, b) => {
      const valA = a[field];
      const valB = b[field];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      return valA < valB ? -1 * direction : 1 * direction;
    });
  }

  // 3. Slice page
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const items = filtered.slice(startIndex, startIndex + limit);

  return {
    items,
    total,
    page,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}
