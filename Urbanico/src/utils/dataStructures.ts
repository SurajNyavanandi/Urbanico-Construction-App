/**
 * Urbanico Data Structures & Algorithms (Frontend)
 * 
 * Clean, well-documented implementations for caching, queuing, and searching.
 * Provides educational value for beginners learning data structures in production React apps.
 */

// ============================================================================
// 1. DATA STRUCTURE: LRUCache (Least Recently Used Cache)
// ============================================================================
/**
 * LRUCache stores key-value pairs up to a set capacity.
 * Evicts the least recently used item when limit is reached.
 * Ideal for memoizing expensive pricing calculations or catalog queries.
 * 
 * Time Complexity:
 * - get: O(1)
 * - set: O(1)
 * - has: O(1)
 */
export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number = 50) {
    this.capacity = Math.max(1, capacity);
    this.cache = new Map<K, V>();
  }

  public get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    const val = this.cache.get(key)!;
    // Delete and re-set to mark as most recently used
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  public set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // First key in Map is least recently used
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
// 2. DATA STRUCTURE: PriorityQueue (Min/Max Heap)
// ============================================================================
/**
 * PriorityQueue implementation using a binary heap.
 * Elements with higher priority (lower comparator value for min-heap)
 * are dequeued first.
 * 
 * Used for:
 * - Order prioritization (Emergency site requests > Regular dispatches)
 * - Offline sync retry queue
 * 
 * Time Complexity:
 * - enqueue: O(log n)
 * - dequeue: O(log n)
 * - peek: O(1)
 */
export class PriorityQueue<T> {
  private heap: T[] = [];
  private comparator: (a: T, b: T) => number;

  /**
   * @param comparator Default comparator treats smaller numbers as higher priority (Min-Heap).
   */
  constructor(comparator: (a: T, b: T) => number = (a: any, b: any) => a - b) {
    this.comparator = comparator;
  }

  public enqueue(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  public dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const root = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.sinkDown(0);
    return root;
  }

  public peek(): T | undefined {
    return this.heap[0];
  }

  public get size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public clear(): void {
    this.heap = [];
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.comparator(this.heap[index], this.heap[parentIndex]) < 0) {
        [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < length && this.comparator(this.heap[leftChild], this.heap[smallest]) < 0) {
        smallest = leftChild;
      }

      if (rightChild < length && this.comparator(this.heap[rightChild], this.heap[smallest]) < 0) {
        smallest = rightChild;
      }

      if (smallest !== index) {
        [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
        index = smallest;
      } else {
        break;
      }
    }
  }
}

// ============================================================================
// 3. ALGORITHMS: Fuzzy Match & Binary Search
// ============================================================================

/**
 * Fuzzy Search Algorithm
 * Determines how closely a text matches a search query.
 * Useful for matching material names, grades, and contractor names even with slight typos.
 * 
 * Returns a score between 0 (no match) and 1 (exact match).
 */
export function fuzzyMatchScore(text: string, query: string): number {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();

  if (!q) return 1;
  if (t === q) return 1;
  if (t.includes(q)) return 0.8 + (q.length / t.length) * 0.2;

  // Subsequence matching
  let tIdx = 0;
  let qIdx = 0;
  let matchedChars = 0;

  while (tIdx < t.length && qIdx < q.length) {
    if (t[tIdx] === q[qIdx]) {
      matchedChars++;
      qIdx++;
    }
    tIdx++;
  }

  if (qIdx === q.length) {
    return (matchedChars / t.length) * 0.7;
  }

  return 0;
}

/**
 * Binary Search Algorithm
 * Finds an item in a sorted array in O(log n) steps.
 */
export function binarySearch<T>(
  sortedArray: T[],
  target: T,
  comparator: (a: T, b: T) => number = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
): number {
  let low = 0;
  let high = sortedArray.length - 1;

  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);
    const comparison = comparator(sortedArray[mid], target);

    if (comparison === 0) {
      return mid;
    } else if (comparison < 0) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return -1;
}
