Here is a simple and efficient Python program to check if a number is prime or not:

```python
def is_prime(n):
# Numbers less than or equal to 1 are not prime
if n <= 1: return False # Check for factors from 2 up to the square root of n for i in range(2, int(n**0.5) + 1): if n %
    i==0: return False # Found a factor, so it's not prime return True # No factors found, it is prime # Get input from
    the user num=int(input("Enter a number: "))

# Output the result
if is_prime(num):
    print(f" {num} is a Prime number.") else: print(f"{num} is NOT a Prime number.") ``` ### How it works: 1. **Edge
    Cases:** Any number less than or equal to `1` (like 0, 1, or negative numbers) is automatically **not** prime. 2.
    **Efficiency Trick (`n**0.5`):** Instead of checking numbers all the way up to $n-1$, we only check up to the
    **square root of $n$**. If a number has a factor larger than its square root, it must also have a matching factor
    smaller than its square root. 3. **Modulo Operator (`%`):** `n % i==0` checks if $n$ is evenly divisible by $i$. If
    it is, the function immediately returns `False`.