#[derive(Debug)]
pub struct Divider {
    all_divisors: Vec<Vec<u32>>,
}

impl Divider {
    pub fn new(target: u32) -> Self {
        let mut all_divisors = Vec::with_capacity(target as usize + 1);
        all_divisors.resize_with(target as usize + 1, Vec::new);

        let mut main_divisors = Vec::new();
        for d in 2..=target {
            if target % d == 0 {
                main_divisors.push(d);
            }
        }

        for &n in &main_divisors {
            let mut divisors = Vec::new();
            for &d in &main_divisors {
                if n % d == 0 {
                    divisors.push(d);
                }
            }
            all_divisors[n as usize] = divisors;
        }

        all_divisors[target as usize] = main_divisors;

        Divider { all_divisors }
    }

    pub fn divisors(&self, n: u32) -> &[u32] {
        &self.all_divisors[n as usize]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test() {
        let divider = Divider::new(2 * 2 * 3 * 7);

        assert_eq!(
            divider.divisors(84),
            &[2, 3, 4, 6, 7, 12, 14, 21, 28, 42, 84]
        );
        assert_eq!(divider.divisors(42), &[2, 3, 6, 7, 14, 21, 42]);
        assert_eq!(divider.divisors(28), &[2, 4, 7, 14, 28]);
        assert_eq!(divider.divisors(21), &[3, 7, 21]);
        assert_eq!(divider.divisors(14), &[2, 7, 14]);
        assert_eq!(divider.divisors(12), &[2, 3, 4, 6, 12]);
        assert_eq!(divider.divisors(7), &[7]);
        assert_eq!(divider.divisors(6), &[2, 3, 6]);
        assert_eq!(divider.divisors(4), &[2, 4]);
        assert_eq!(divider.divisors(3), &[3]);
        assert_eq!(divider.divisors(2), &[2]);
    }
}
