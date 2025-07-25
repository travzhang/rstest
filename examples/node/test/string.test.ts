import { describe, expect, it } from '@rstest/core';
import {
  capitalize,
  countWords,
  isPalindrome,
  reverseString,
  truncate,
} from '../src/string';

describe('String Utils', () => {
  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle single character', () => {
      expect(capitalize('a')).toBe('A');
    });
  });

  describe('reverseString', () => {
    it('should reverse string', () => {
      expect(reverseString('hello')).toBe('olleh');
    });

    it('should handle empty string', () => {
      expect(reverseString('')).toBe('');
    });

    it('should handle palindrome', () => {
      expect(reverseString('racecar')).toBe('racecar');
    });
  });

  describe('isPalindrome', () => {
    it('should return true for palindrome', () => {
      expect(isPalindrome('racecar')).toBe(true);
    });

    it('should return true for palindrome with spaces', () => {
      expect(isPalindrome('A man a plan a canal Panama')).toBe(true);
    });

    it('should return false for non-palindrome', () => {
      expect(isPalindrome('hello')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(isPalindrome('')).toBe(true);
    });
  });

  describe('countWords', () => {
    it('should count words correctly', () => {
      expect(countWords('hello world')).toBe(2);
    });

    it('should handle multiple spaces', () => {
      expect(countWords('hello    world   test')).toBe(3);
    });

    it('should handle empty string', () => {
      expect(countWords('')).toBe(0);
    });

    it('should handle single word', () => {
      expect(countWords('hello')).toBe(1);
    });
  });

  describe('truncate', () => {
    it('should truncate long string', () => {
      expect(truncate('This is a very long string', 10)).toBe('This is...');
    });

    it('should not truncate short string', () => {
      expect(truncate('Short', 10)).toBe('Short');
    });

    it('should handle exact length', () => {
      expect(truncate('Exactly10!', 10)).toBe('Exactly10!');
    });
  });
});
